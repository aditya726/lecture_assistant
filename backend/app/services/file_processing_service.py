import os
import tempfile
from typing import Optional, BinaryIO
from PIL import Image
import PyPDF2
from docx import Document
import base64
import io
from app.services.ocr_service import ocr_service

class FileProcessingService:
    
    def __init__(self):
        self.supported_image_formats = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}
        self.supported_document_formats = {'.pdf', '.docx', '.txt'}
        self.max_file_size = 50 * 1024 * 1024  # 50 MB
    
    async def process_image(self, image_path: str) -> dict:
        """
        Process image file - extract text using OCR if available, and prepare for vision model
        
        Args:
            image_path: Path to image file
        
        Returns:
            dict with image info and base64 encoded image
        """
        try:
            with Image.open(image_path) as img:
                # Get image info
                info = {
                    "format": img.format,
                    "size": img.size,
                    "mode": img.mode,
                }
                
                # Convert to base64 for vision model
                buffered = io.BytesIO()
                img.save(buffered, format=img.format if img.format else "PNG")
                img_base64 = base64.b64encode(buffered.getvalue()).decode()

                # Try OCR extraction if available
                ocr_result = ocr_service.extract_text_from_image(image_path)
                ocr_summary = None
                if ocr_result.get("success") and ocr_result.get("text"):
                    # Prepare short preview of OCR text
                    txt = ocr_result.get("text", "")
                    ocr_summary = txt[:500] + "..." if len(txt) > 500 else txt
                    try:
                        preview = (ocr_summary or "")[:200].replace("\n", " ")
                        print(f"[Upload] OCR succeeded for {image_path}. Preview: '{preview}'{'...' if ocr_summary and len(ocr_summary) > 200 else ''}")
                    except Exception:
                        pass
                else:
                    try:
                        err = ocr_result.get("error") if isinstance(ocr_result, dict) else None
                        stage = ocr_result.get("stage") if isinstance(ocr_result, dict) else None
                        print(f"[Upload] OCR returned no text for {image_path}. Stage={stage} Error={err}. Using image description fallback.")
                    except Exception:
                        pass
                
                return {
                    "type": "image",
                    "info": info,
                    "base64": img_base64,
                    "description": f"Image: {img.size[0]}x{img.size[1]} pixels",
                    "ocr": ocr_result,
                    "ocr_preview": ocr_summary
                }
        except Exception as e:
            raise Exception(f"Image processing error: {str(e)}")
    
    async def process_pdf(self, pdf_path: str) -> dict:
        """
        Extract text from PDF file
        
        Args:
            pdf_path: Path to PDF file
        
        Returns:
            dict with extracted text
        """
        try:
            text_content = []
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                num_pages = len(pdf_reader.pages)
                
                for page_num in range(num_pages):
                    page = pdf_reader.pages[page_num]
                    text = page.extract_text()
                    if text.strip():
                        text_content.append(f"--- Page {page_num + 1} ---\n{text}")
            
            full_text = "\n\n".join(text_content)
            return {
                "type": "pdf",
                "num_pages": num_pages,
                "text": full_text,
                "preview": full_text[:500] + "..." if len(full_text) > 500 else full_text
            }
        except Exception as e:
            raise Exception(f"PDF processing error: {str(e)}")
    
    async def process_docx(self, docx_path: str) -> dict:
        """
        Extract text from DOCX file
        
        Args:
            docx_path: Path to DOCX file
        
        Returns:
            dict with extracted text
        """
        try:
            doc = Document(docx_path)
            paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
            full_text = "\n\n".join(paragraphs)
            
            return {
                "type": "docx",
                "num_paragraphs": len(paragraphs),
                "text": full_text,
                "preview": full_text[:500] + "..." if len(full_text) > 500 else full_text
            }
        except Exception as e:
            raise Exception(f"DOCX processing error: {str(e)}")
    
    async def process_text_file(self, text_path: str) -> dict:
        """
        Read text file
        
        Args:
            text_path: Path to text file
        
        Returns:
            dict with text content
        """
        try:
            with open(text_path, 'r', encoding='utf-8') as file:
                text = file.read()
            
            return {
                "type": "text",
                "text": text,
                "preview": text[:500] + "..." if len(text) > 500 else text
            }
        except UnicodeDecodeError:
            # Try with different encoding
            try:
                with open(text_path, 'r', encoding='latin-1') as file:
                    text = file.read()
                return {
                    "type": "text",
                    "text": text,
                    "preview": text[:500] + "..." if len(text) > 500 else text
                }
            except Exception as e:
                raise Exception(f"Text file processing error: {str(e)}")
        except Exception as e:
            raise Exception(f"Text file processing error: {str(e)}")
    
    async def process_video(self, video_path: str) -> dict:
        """
        Process video file - for now, just return metadata
        Note: Full video processing would require additional libraries like opencv-python
        
        Args:
            video_path: Path to video file
        
        Returns:
            dict with video info
        """
        try:
            file_size = os.path.getsize(video_path)
            return {
                "type": "video",
                "size": file_size,
                "message": "Video uploaded successfully. For transcription, please extract audio separately."
            }
        except Exception as e:
            raise Exception(f"Video processing error: {str(e)}")
    
    async def process_file(self, file_path: str, file_extension: str) -> dict:
        """
        Process file based on its type
        
        Args:
            file_path: Path to file
            file_extension: File extension (with dot, e.g., '.pdf')
        
        Returns:
            dict with processed file content
        """
        file_extension = file_extension.lower()
        
        if file_extension in self.supported_image_formats:
            return await self.process_image(file_path)
        elif file_extension == '.pdf':
            return await self.process_pdf(file_path)
        elif file_extension == '.docx':
            return await self.process_docx(file_path)
        elif file_extension == '.txt':
            return await self.process_text_file(file_path)
        elif file_extension in {'.mp4', '.avi', '.mov', '.mkv', '.webm'}:
            return await self.process_video(file_path)
        else:
            raise Exception(f"Unsupported file format: {file_extension}")

# Global instance
file_processing_service = FileProcessingService()
