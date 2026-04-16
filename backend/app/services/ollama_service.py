import ollama
import json
import re
from app.core.config import settings

class OllamaService:
    def __init__(self):
        self.client = ollama.Client(host=settings.OLLAMA_HOST)
        self.model = settings.OLLAMA_MODEL
    
    async def generate_response(self, prompt: str) -> str:
        """Generate AI response using Ollama with automatic question detection and solving"""
        try:
            # Enhance prompt to detect and solve questions
            enhanced_prompt = f"""You are a helpful educational AI assistant. Analyze the following prompt:

{prompt}

Instructions:
1. If this contains any questions, problems, equations, or exercises - solve them completely with step-by-step explanations
2. Show all work, formulas, and reasoning
3. Provide comprehensive, descriptive answers (not brief responses)
4. Include examples and applications where relevant
5. If there are multiple questions or problems, address each one thoroughly
6. For any mathematical or scientific problems, explain the concepts involved

Provide a thorough, educational response:"""
            
            import asyncio
            import functools
            response = await asyncio.to_thread(
                functools.partial(self.client.generate, model=self.model, prompt=enhanced_prompt)
            )
            return response['response']
        except Exception as e:
            raise Exception(f"Ollama error: {str(e)}")
    
    async def chat(self, messages: list) -> str:
        """Chat with AI using conversation history with enhanced question detection"""
        try:
            # Add system instruction to solve questions
            enhanced_messages = [{
                "role": "system",
                "content": """You are a helpful educational AI assistant. When the user asks a question or presents a problem:
1. Identify if it's a question or problem that needs solving
2. If it contains equations, math problems, or questions, provide step-by-step solutions with detailed explanations
3. Show all work and reasoning clearly
4. Provide comprehensive, descriptive answers (not brief)
5. Include examples and real-world applications where relevant
6. If there are multiple questions, answer each one thoroughly

Be thorough, educational, and solve all problems completely."""
            }]
            enhanced_messages.extend(messages)
            
            import asyncio
            import functools
            response = await asyncio.to_thread(
                functools.partial(self.client.chat, model=self.model, messages=enhanced_messages)
            )
            return response['message']['content']
        except Exception as e:
            raise Exception(f"Ollama chat error: {str(e)}")
    
    async def summarize_text(self, text: str, context: str = None) -> dict:
        """Summarize the given text"""
        if not (text or "").strip():
            return {
                "summary": "No text provided.",
                "key_points": []
            }

        prompt = f"""Analyze the following text comprehensively and provide a detailed response:

1. A detailed summary (4-6 sentences) covering all main ideas and important details
2. Key points (5-8 comprehensive bullet points with explanations)
3. If any equations or problems are present, solve them step-by-step with detailed explanations
4. Include relevant examples or applications where applicable
5. Highlight any important terminology or concepts

Text: {text}
{f'Context: {context}' if context else ''}

Provide a thorough, descriptive analysis. Be specific and informative.

Respond in JSON format:
{{
    "summary": "...",
    "key_points": ["point1", "point2", "point3", "point4", "point5"]
}}"""
        
        response = await self.generate_response(prompt)
        parsed = self._parse_json_response(response)

        # If the model didn't follow JSON format (common with noisy OCR text), retry once
        # with a stricter prompt that bypasses the extra instruction wrapper.
        if self._needs_json_retry(parsed, original_text=text):
            strict_prompt = self._build_strict_summary_prompt(text=text, context=context)
            try:
                import asyncio
                import functools
                strict_resp = await asyncio.to_thread(
                    functools.partial(self.client.generate, model=self.model, prompt=strict_prompt)
                )
                strict_raw = strict_resp["response"]
                strict_parsed = self._parse_json_response(strict_raw)
                if not self._needs_json_retry(strict_parsed, original_text=text):
                    return self._normalize_summary_payload(strict_parsed, original_text=text)
            except Exception:
                pass

        # Final normalization/fallback (never return empty payload)
        return self._normalize_summary_payload(parsed, original_text=text)

    def _needs_json_retry(self, parsed: dict, original_text: str) -> bool:
        try:
            if not isinstance(parsed, dict):
                return True
            if parsed.get("error") is True:
                return True
            summary = (parsed.get("summary") or "").strip()
            key_points = parsed.get("key_points")
            if not summary:
                return True
            if not isinstance(key_points, list) or len(key_points) == 0:
                # allow empty key_points only when the input is very short
                if len((original_text or "").strip()) > 40:
                    return True
            # Detect the common meta-response when the model claims no input was provided
            lowered = summary.lower()
            if ("you have not provided" in lowered or "please provide the text" in lowered) and (original_text or "").strip():
                return True
            return False
        except Exception:
            return True

    def _build_strict_summary_prompt(self, text: str, context: str = None) -> str:
        ctx = (context or "").strip()
        return (
            "You are a JSON generator. Return ONLY valid JSON, no markdown, no extra keys.\n"
            "Schema:\n"
            "{\n"
            "  \"summary\": string,\n"
            "  \"key_points\": string[]\n"
            "}\n\n"
            "Rules:\n"
            "- summary: 4-6 sentences\n"
            "- key_points: 5-8 bullets (strings)\n"
            "- If the text is empty, return summary='No text provided.' and key_points=[]\n\n"
            + (f"Context: {ctx}\n\n" if ctx else "")
            + "<text>\n"
            + (text or "")
            + "\n</text>"
        )

    def _normalize_summary_payload(self, parsed: dict, original_text: str) -> dict:
        # Ensure required keys exist and contain sensible values.
        summary = ""
        key_points = []

        if isinstance(parsed, dict):
            summary = (parsed.get("summary") or "").strip()
            kp = parsed.get("key_points")
            if isinstance(kp, list):
                for x in kp:
                    if isinstance(x, dict):
                        # Extract text if AI hallucinates dictionary structure
                        text_val = ""
                        if "description" in x and "explanation" in x:
                            text_val = f"{x['description']} - {x['explanation']}"
                        elif "description" in x:
                            text_val = str(x['description'])
                        elif "point" in x:
                            text_val = str(x['point'])
                        elif "title" in x and "content" in x:
                            text_val = f"{x['title']}: {x['content']}"
                        elif "text" in x:
                            text_val = str(x['text'])
                        else:
                            # fallback: use the first string value from the dict
                            vals = [str(v) for v in x.values() if isinstance(v, str)]
                            text_val = " - ".join(vals) if vals else str(x)
                        
                        if text_val.strip():
                            key_points.append(text_val.strip())
                    elif str(x).strip():
                        key_points.append(str(x).strip())

        if not summary:
            summary, key_points = self._simple_fallback_summary(original_text)

        if not key_points and len((original_text or "").strip()) > 40:
            # Derive key points from text if model didn't provide them
            _, derived_kp = self._simple_fallback_summary(original_text)
            key_points = derived_kp

        return {
            "summary": summary,
            "key_points": key_points,
        }

    def _simple_fallback_summary(self, text: str) -> tuple[str, list]:
        cleaned = (text or "").strip()
        if not cleaned:
            return "No text provided.", []

        # Normalize whitespace
        cleaned = re.sub(r"\s+", " ", cleaned)

        # Sentence-ish split
        sentences = re.split(r"(?<=[.!?])\s+", cleaned)
        sentences = [s.strip() for s in sentences if s.strip()]

        summary = " ".join(sentences[:4])
        if not summary:
            summary = cleaned[:600] + ("..." if len(cleaned) > 600 else "")

        # Key points: use first lines or sentence fragments
        key_points = []
        for s in sentences[:8]:
            if len(key_points) >= 6:
                break
            if len(s) < 8:
                continue
            key_points.append(s if len(s) <= 180 else s[:180] + "...")

        if not key_points:
            key_points = [cleaned[:180] + ("..." if len(cleaned) > 180 else "")]

        return summary, key_points
    
    async def explain_doubt(self, text: str, context: str = None) -> dict:
        """Explain a doubt or concept"""
        prompt = f"""Provide a comprehensive and detailed explanation for the following doubt/question:

Question/Doubt: {text}
{f'Context: {context}' if context else ''}

Provide an in-depth response including:
1. A thorough, detailed explanation covering all aspects (use multiple paragraphs if needed)
2. 4-5 practical, real-world examples with detailed descriptions
3. Related concepts to explore with brief explanations
4. If any equations or problems are present, solve them step-by-step with detailed reasoning for each step
5. Common misconceptions or pitfalls to avoid
6. Additional resources or topics for further learning

Be descriptive, educational, and thorough in your response.

Respond ONLY with valid, perfectly formatted JSON. No other text, no markdown blocks, no conversational text. Include quotes around ALL strings. Format exactly like this:
{{
    "explanation": "Detailed explanation here...",
    "examples": ["example1", "example2", "example3", "example4"],
    "related_concepts": ["concept1", "concept2", "concept3"]
}}"""
        
        response = await self.generate_response(prompt)
        return self._parse_json_response(response)
    
    async def process_lecture(self, text: str, context: str = None) -> dict:
        """Process a lecture transcript to provide summary, tags, and resources in one go."""
        prompt = f"""You are an expert educational AI. Process the following lecture transcript:

Text: {text}
{f'Context: {context}' if context else ''}

Provide a comprehensive analysis in JSON format covering:
1. "summary": A clean, detailed, organized summary of the lecture.
2. "key_points": A list of important bullet points (5-8 points).
3. "tags": An object with "subject", "topic", and "difficulty" (e.g., beginner, intermediate, advanced).
4. "related_resources": A list of 3-5 search queries or topics the student can use to find related YouTube videos, papers, or PDFs.

Respond ONLY with valid, perfectly formatted JSON. No other text, no markdown blocks, no conversational text. Include quotes around ALL strings. Format exactly like this:
{{
    "summary": "Full summary text here...",
    "key_points": ["point 1", "point 2", "point 3"],
    "tags": {{
        "subject": "Math",
        "topic": "Calculus",
        "difficulty": "intermediate"
    }},
    "related_resources": ["resource 1", "resource 2", "resource 3"]
}}"""
        response = await self.generate_response(prompt)
        parsed = self._parse_json_response(response)
        
        # If parsing fails, use regex immediately to avoid slow LLM retry delays
        if parsed.get("error"):
            raw = parsed.get("summary", "") # _parse_json_response sticks raw output into summary on error
            
            # Robust regex fallbacks
            summary = ""
            summary_match = re.search(r'"summary"\s*:\s*"((?:[^"\\]|\\.)*)"', raw, re.DOTALL)
            if summary_match:
                summary = summary_match.group(1).replace('\\n', '\n').replace('\\"', '"')
            else:
                # If even regex fails, fallback to first 600 chars
                summary = raw[:600] + ("..." if len(raw) > 600 else "")
                
            # Extract key_points
            key_points = []
            kp_match = re.search(r'"key_points"\s*:\s*\[(.*?)\]', raw, re.DOTALL)
            if kp_match:
                kp_raw = kp_match.group(1)
                # Find all string items in the array (handling escaped quotes)
                key_points = [m.group(1).replace('\\"', '"') for m in re.finditer(r'"((?:[^"\\]|\\.)*)"', kp_raw)]
                
            # Extract tags (subject, topic, difficulty)
            tags = {"subject": "General", "topic": "Concept", "difficulty": "Unknown"}
            tags_match = re.search(r'"tags"\s*:\s*\{(.*?)\}', raw, re.DOTALL)
            if tags_match:
                tags_raw = tags_match.group(1)
                for tag_field in ["subject", "topic", "difficulty"]:
                    field_match = re.search(fr'"{tag_field}"\s*:\s*"((?:[^"\\]|\\.)*)"', tags_raw)
                    if field_match:
                        tags[tag_field] = field_match.group(1).replace('\\"', '"')
                        
            # Extract related_resources
            related_resources = []
            rr_match = re.search(r'"related_resources"\s*:\s*\[(.*?)\]', raw, re.DOTALL)
            if rr_match:
                rr_raw = rr_match.group(1)
                related_resources = [m.group(1).replace('\\"', '"') for m in re.finditer(r'"((?:[^"\\]|\\.)*)"', rr_raw)]

            return {
                "summary": summary,
                "key_points": key_points,
                "tags": tags,
                "related_resources": related_resources
            }

        return parsed

    async def extract_topics(self, text: str) -> dict:
        """Extract main topics and subtopics from text"""
        prompt = f"""Analyze the following text comprehensively and extract detailed information:

1. Main topics (5-8 topics with descriptive titles)
2. Subtopics under each main topic with explanations
3. Key themes and concepts
4. Learning objectives that can be derived

Text: {text}

Provide thorough topic analysis with descriptive labels.

Respond in JSON format:
{{
    "main_topics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
    "subtopics": ["subtopic1", "subtopic2", "subtopic3", "subtopic4"]
}}"""
        
        response = await self.generate_response(prompt)
        return self._parse_json_response(response)
    
    async def classify_difficulty(self, text: str) -> dict:
        """Classify the difficulty level of content"""
        prompt = f"""Analyze the following content in detail and classify its difficulty level:

Content: {text}

Provide a comprehensive analysis:
1. Classify as: beginner, intermediate, advanced, or expert
2. Provide detailed reasoning for your classification (multiple sentences)
3. List all prerequisites needed with descriptions
4. Estimate time to understand the content
5. Suggest learning path or approach
6. Identify what makes it challenging or easy

Be thorough and descriptive in your analysis.

Respond in JSON format:
{{
    "difficulty_level": "intermediate",
    "reasoning": "...",
    "prerequisites": ["prerequisite1", "prerequisite2", "prerequisite3"]
}}"""
        
        response = await self.generate_response(prompt)
        return self._parse_json_response(response)
    
    async def extract_keywords(self, text: str) -> dict:
        """Extract keywords and key phrases from text"""
        prompt = f"""Extract and analyze important keywords and key phrases from the following text:

Text: {text}

Provide a comprehensive extraction:
1. Single-word keywords (10-15 important words)
2. Key phrases (5-8 descriptive phrases)
3. Technical terms and jargon
4. Core concepts and their importance

Be thorough and include all significant terms.

Respond in JSON format:
{{
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "phrases": ["phrase1", "phrase2", "phrase3", "phrase4"]
}}"""
        
        response = await self.generate_response(prompt)
        return self._parse_json_response(response)
    
    def _parse_json_response(self, response: str) -> dict:
        """Parse JSON from LLM response"""
        try:
            # Clean up the response - remove markdown code blocks and extra text
            cleaned = response.strip()
            
            # Remove markdown code blocks
            cleaned = re.sub(r'^```json\s*', '', cleaned)
            cleaned = re.sub(r'^```\s*', '', cleaned)
            cleaned = re.sub(r'\s*```$', '', cleaned)
            
            # Find JSON object (first { to last })
            start = cleaned.find('{')
            end = cleaned.rfind('}')
            
            if start != -1 and end != -1 and end > start:
                json_str = cleaned[start:end+1]
                # Fix common JSON issues keeping newlines safe
                json_str = re.sub(r',\s*}', '}', json_str)  # Remove trailing commas
                json_str = re.sub(r',\s*]', ']', json_str)  # Remove trailing commas in arrays
                # Fix double-escaped or poorly escaped quotes
                json_str = json_str.replace('\\"\\"', '\\"')
                # Replace unescaped newlines inside strings, or just use strict=False
                return json.loads(json_str, strict=False)
            
            # Try parsing the whole response
            return json.loads(cleaned, strict=False)
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback for completely malformed JSON:
            # Instead of returning a generic error, we return the raw LLM output as the summary/explanation 
            # so the user doesn't lose the hard work the AI did.
            raw_text = response.strip()
            if not raw_text:
                raw_text = "The AI provided an empty response. Please try again."
                
            return {
                "summary": raw_text,
                "explanation": raw_text,
                "key_points": [],
                "tags": {"subject": "General", "topic": "Concept", "difficulty": "Unknown"},
                "related_resources": [],
                "topics": [],
                "questions": [],
                "keywords": [],
                "phrases": [],
                "error": True
            }
    
    async def analyze_image(self, image_base64: str, prompt: str = None) -> dict:
        """
        Analyze image using vision model (requires LLaVA or similar vision model)
        
        Args:
            image_base64: Base64 encoded image
            prompt: Optional prompt for specific analysis
        
        Returns:
            dict with analysis results
        """
        try:
            default_prompt = """Provide a comprehensive and detailed analysis of this image:

1. Describe all visible elements, objects, text, diagrams, and their relationships in detail
2. Identify the type of content (educational material, document, diagram, photograph, etc.)
3. Extract and explain any text, formulas, equations, or problems shown in the image
4. If it contains educational content, explain the concepts being taught
5. If there are diagrams or charts, describe what they represent and their significance
6. Suggest how this could be used in an educational context
7. If there are any equations or problems, solve them step-by-step
8. Provide relevant background information or context

Be extremely thorough and descriptive in your analysis. Include every detail you can observe."""
            analysis_prompt = prompt or default_prompt
            
            # Try to use vision model if available (llava, bakllava, etc.)
            try:
                import asyncio
                import functools
                response = await asyncio.to_thread(
                    functools.partial(self.client.generate, model="llava", prompt=analysis_prompt, images=[image_base64])
                )
                return {
                    "description": response['response'],
                    "model": "llava"
                }
            except Exception as vision_error:
                # Fallback: Use text description
                return {
                    "description": "Image analysis requires a vision model like LLaVA. Please install it with: ollama pull llava",
                    "error": str(vision_error),
                    "model": "none"
                }
        except Exception as e:
            raise Exception(f"Image analysis error: {str(e)}")
    
    async def summarize_document(self, document_text: str, document_type: str = "document") -> dict:
        """
        Specialized summarization for documents
        
        Args:
            document_text: Extracted text from document
            document_type: Type of document (pdf, docx, etc.)
        
        Returns:
            dict with comprehensive summary
        """
        prompt = f"""Provide a comprehensive and detailed analysis of the following {document_type} content:

1. Executive Summary (5-8 sentences covering all major aspects)
2. Main Topics (5-10 topics with detailed descriptions for each)
3. Key Takeaways (8-12 important points with explanations)
4. Detailed Study Notes (organized bullet points with comprehensive coverage)
5. If any equations or problems are present, solve them step-by-step with detailed explanations
6. Important terminology and definitions
7. Practical applications or real-world relevance
8. Connections between different sections or concepts

Be extremely thorough and descriptive. This should serve as a comprehensive study resource.

Document Content:
{document_text[:4000]}  # Limit to avoid token limits

Respond in JSON format:
{{
    "executive_summary": "...",
    "main_topics": [
        {{"topic": "Topic 1", "description": "Brief description"}},
        {{"topic": "Topic 2", "description": "Brief description"}}
    ],
    "key_takeaways": ["takeaway1", "takeaway2"],
    "study_notes": ["note1", "note2", "note3"]
}}"""
        
        response = await self.generate_response(prompt)
        return self._parse_json_response(response)

    async def generate_draft_notes(self, text: str, context: str = None) -> dict:
        """Generate structured draft notes requiring user editing"""
        prompt = f"""Generate INCOMPLETE draft notes from the following content. 
The notes should be 60-70% complete to encourage active learning:

Text: {text}
{f'Context: {context}' if context else ''}

Create a structured response with:
1. A descriptive title
2. 3-5 main sections with PARTIAL information (leave gaps for user to fill)
3. Use placeholders like [ADD YOUR UNDERSTANDING], [EXPLAIN IN YOUR WORDS], [INSERT EXAMPLE]
4. List 3-4 suggestions for what the user should add/expand
5. Rate completeness (aim for 60-70%)

The goal is to make students actively engage with the material, not passively consume it.

Respond in JSON format:
{{
    "draft_title": "Draft: [Topic Name]",
    "sections": [
        {{"title": "Introduction", "content": "Brief intro... [ADD YOUR UNDERSTANDING OF WHY THIS MATTERS]", "editable": true}},
        {{"title": "Key Concepts", "content": "Concept 1: definition... [EXPLAIN IN YOUR WORDS]\\nConcept 2: [RESEARCH AND ADD]", "editable": true}},
        {{"title": "Examples", "content": "[INSERT EXAMPLE 1]\\n[INSERT EXAMPLE 2]", "editable": true}}
    ],
    "suggested_improvements": [
        "Add examples for the key concepts",
        "Expand the introduction with real-world applications",
        "Include your own understanding of why this is important"
    ],
    "completeness_score": 65
}}"""
        
        response = await self.generate_response(prompt)
        return self._parse_json_response(response)
    
    async def expand_micronote(
        self, 
        key_phrase: str, 
        transcript_context: str, 
        style: str = "detailed"
    ) -> dict:
        """Expand a key phrase using transcript context"""
        
        style_instructions = {
            "detailed": "Write 2-3 comprehensive paragraphs with examples and explanations",
            "concise": "Write 3-5 clear sentences capturing the essence",
            "bullet_points": "Create 5-7 detailed bullet points with explanations"
        }
        
        prompt = f"""You have a lecture transcript and a student's key phrase. 
Expand the key phrase into a complete note using relevant information from the transcript.

Key Phrase: "{key_phrase}"

Full Transcript:
{transcript_context}

Instructions:
1. Find all relevant information in the transcript related to the key phrase
2. {style_instructions.get(style, style_instructions["detailed"])}
3. Extract 2-3 direct quotes from the transcript that support this topic
4. Identify timestamp markers if present (e.g., [00:15:30] or "at 15 minutes")
5. Make the expansion natural, study-friendly, and comprehensive
6. Connect related ideas from different parts of the transcript

Respond in JSON format:
{{
    "original_phrase": "{key_phrase}",
    "expanded_content": "Your expanded explanation here...",
    "relevant_quotes": ["Direct quote 1 from transcript", "Direct quote 2 from transcript"],
    "timestamp_references": [
        {{"time": "00:15:30", "relevance": "Main definition provided"}},
        {{"time": "00:22:15", "relevance": "Example discussed"}}
    ]
}}"""
        
        response = await self.generate_response(prompt)
        return self._parse_json_response(response)

ollama_service = OllamaService()
