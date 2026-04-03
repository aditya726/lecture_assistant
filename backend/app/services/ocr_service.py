import os
from typing import Optional, Dict, Any


class OCRService:
    def __init__(self):
        self._ocr = None
        self._available = False
        self._init_error: Optional[str] = None

    def _ensure_initialized(self):
        if self._ocr or self._available:
            return
        try:
            # Lazy import to avoid mandatory dependency at startup
            # Also force-disable OneDNN/MKLDNN to avoid CPU backend issues on Windows
            try:
                os.environ.setdefault('FLAGS_use_mkldnn', '0')
                os.environ.setdefault('FLAGS_use_pir_api', '0')
                os.environ.setdefault('OMP_NUM_THREADS', '1')
                os.environ.setdefault('MKL_NUM_THREADS', '1')
                os.environ.setdefault('FLAGS_allocator_strategy', 'naive_best_fit')
            except Exception:
                pass
            from paddleocr import PaddleOCR  # type: ignore
            # Prefer CPU device explicitly if available
            try:
                import paddle  # type: ignore
                paddle.set_device('cpu')
            except Exception:
                pass

            # Try full init without unsupported args like 'use_gpu'
            self._ocr = None
            init_errors = []
            for init_variant in (
                {"use_angle_cls": True, "lang": 'en', "det_db_box_thresh": 0.3, "det_db_thresh": 0.2, "use_mkldnn": False},
                {"use_angle_cls": True, "lang": 'en', "use_mkldnn": False},
                {"lang": 'en', "use_mkldnn": False},
            ):
                try:
                    self._ocr = PaddleOCR(**init_variant)
                    break
                except TypeError as e:
                    init_errors.append(str(e))
                except Exception as e:
                    init_errors.append(str(e))

            if self._ocr is None:
                raise Exception("; ".join(init_errors))

            self._available = True
        except Exception as e:
            # Record error and mark unavailable; callers can handle fallback
            self._init_error = str(e)
            self._available = False

    def is_available(self) -> bool:
        self._ensure_initialized()
        return self._available

    def get_init_error(self) -> Optional[str]:
        return self._init_error

    def extract_text_from_image(self, image_path: str) -> Dict[str, Any]:
        """
        Run OCR on an image file using PaddleOCR.

        Returns a dict with keys:
        - success: bool
        - text: concatenated text (if any)
        - boxes: list of [points, text, confidence]
        - error: optional initialization or runtime error
        """
        self._ensure_initialized()
        if not os.path.exists(image_path):
            return {"success": False, "text": "", "boxes": [], "error": "Image path does not exist"}

        if not self._available or self._ocr is None:
            return {"success": False, "text": "", "boxes": [], "error": self._init_error or "PaddleOCR not available"}

        try:
            import cv2  # type: ignore
            import tempfile

            def _run(path: str):
                # Some PaddleOCR versions don't accept 'cls' in the ocr() call; rely on init setting
                res = self._ocr.ocr(path)
                _boxes = []
                _lines = []
                # Normalize result shape for both single-image and batched returns
                items = res
                try:
                    if isinstance(res, list) and len(res) == 1 and isinstance(res[0], list) and res[0] and isinstance(res[0][0], (list, tuple)):
                        items = res[0]
                except Exception:
                    items = res
                for line in (items or []):
                    try:
                        pts = line[0]
                        txt = line[1][0]
                        conf = float(line[1][1]) if line[1][1] is not None else 0.0
                        _boxes.append({"points": pts, "text": txt, "confidence": conf})
                        if txt:
                            _lines.append(txt)
                    except Exception:
                        continue
                return _boxes, _lines

            stage_used = "original"
            boxes, lines = _run(image_path)
            combined_text = "\n".join(lines).strip()

            # If empty, try preprocessing (grayscale, blur, adaptive threshold)
            if not combined_text:
                try:
                    img = cv2.imread(image_path)
                    if img is not None:
                        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                        blur = cv2.medianBlur(gray, 3)
                        thr = cv2.adaptiveThreshold(
                            blur, 255,
                            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                            cv2.THRESH_BINARY, 31, 9
                        )
                        # Also try inverted for light text on dark background
                        inv = cv2.bitwise_not(thr)

                        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp:
                            cv2.imwrite(tmp.name, thr)
                            boxes_thr, lines_thr = _run(tmp.name)
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp2:
                            cv2.imwrite(tmp2.name, inv)
                            boxes_inv, lines_inv = _run(tmp2.name)

                        # Choose the better of thr vs inv by count, tiebreaker by avg confidence
                        cand = [
                            ("preprocess_binary", boxes_thr, lines_thr),
                            ("preprocess_inverted", boxes_inv, lines_inv),
                        ]
                        def avg_conf(bx):
                            if not bx:
                                return 0.0
                            return float(sum([b.get("confidence", 0.0) for b in bx]) / len(bx))
                        best = max(cand, key=lambda t: (len(t[2]), avg_conf(t[1])))
                        if len(best[2]) > len(lines):
                            stage_used = best[0]
                            boxes = best[1]
                            lines = best[2]
                            combined_text = "\n".join(lines).strip()
                except Exception:
                    pass

            # If still empty, upscale and retry
            if not combined_text:
                try:
                    img = cv2.imread(image_path)
                    if img is not None:
                        up = cv2.resize(img, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp:
                            cv2.imwrite(tmp.name, up)
                            boxes_up, lines_up = _run(tmp.name)
                        if len(lines_up) > len(lines):
                            stage_used = "upscaled"
                            boxes = boxes_up
                            lines = lines_up
                            combined_text = "\n".join(lines).strip()
                except Exception:
                    pass

            # If still empty, try CLAHE + OTSU + morphology close
            if not combined_text:
                try:
                    img = cv2.imread(image_path)
                    if img is not None:
                        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                        eq = clahe.apply(gray)
                        # OTSU threshold
                        _, otsu = cv2.threshold(eq, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                        inv_otsu = cv2.bitwise_not(otsu)
                        # Morph close to connect broken strokes
                        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3,3))
                        closed = cv2.morphologyEx(otsu, cv2.MORPH_CLOSE, kernel, iterations=1)
                        inv_closed = cv2.bitwise_not(closed)

                        candidates = []
                        for arr, label in [(otsu, "clahe_otsu"), (inv_otsu, "clahe_otsu_inverted"), (closed, "clahe_otsu_closed"), (inv_closed, "clahe_otsu_closed_inverted")]:
                            with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp:
                                cv2.imwrite(tmp.name, arr)
                                b, l = _run(tmp.name)
                                candidates.append((label, b, l))

                        def avg_conf2(bx):
                            if not bx:
                                return 0.0
                            return float(sum([b.get("confidence", 0.0) for b in bx]) / len(bx))
                        best2 = max(candidates, key=lambda t: (len(t[2]), avg_conf2(t[1])))
                        if len(best2[2]) > len(lines):
                            stage_used = best2[0]
                            boxes = best2[1]
                            lines = best2[2]
                            combined_text = "\n".join(lines).strip()
                except Exception:
                    pass

            # If still empty, try rotations (90°, 270°)
            if not combined_text:
                try:
                    img = cv2.imread(image_path)
                    if img is not None:
                        rot90 = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
                        rot270 = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp:
                            cv2.imwrite(tmp.name, rot90)
                            b90, l90 = _run(tmp.name)
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as tmp2:
                            cv2.imwrite(tmp2.name, rot270)
                            b270, l270 = _run(tmp2.name)
                        # choose best rotation
                        rotation_best = max([("rot90", b90, l90), ("rot270", b270, l270)], key=lambda t: (len(t[2]), avg_conf([*t[1]])))
                        if len(rotation_best[2]) > len(lines):
                            stage_used = rotation_best[0]
                            boxes = rotation_best[1]
                            lines = rotation_best[2]
                            combined_text = "\n".join(lines).strip()
                except Exception:
                    pass

            return {
                "success": True,
                "text": combined_text,
                "boxes": boxes,
                "stage": stage_used
            }
        except Exception as e:
            return {"success": False, "text": "", "boxes": [], "error": str(e)}


# Global instance
ocr_service = OCRService()
