"""
Wordware AI Client Service

This module provides a client for interacting with Wordware AI's API.
Wordware allows you to create AI agents (WordApps) that can be called via API.
"""

import os
import httpx
import json
from typing import Dict, Any, Optional, List
from datetime import datetime


class WordwareClient:
    """Client for interacting with Wordware AI API"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Wordware client
        
        Args:
            api_key: Wordware API key. If not provided, will use WORDWARE_API_KEY env var
        """
        self.api_key = api_key or os.getenv("WORDWARE_API_KEY")
        if not self.api_key:
            raise ValueError("Wordware API key is required. Set WORDWARE_API_KEY environment variable.")
        
        self.base_url = "https://app.wordware.ai/api"
        self.timeout = 120.0  # 2 minutes timeout for long-running analysis
    
    async def run_wordapp(
        self, 
        app_id: str, 
        inputs: Dict[str, Any], 
        version: str = "^1.0"
    ) -> Dict[str, Any]:
        """
        Run a Wordware WordApp
        
        Args:
            app_id: The ID of the deployed WordApp
            inputs: Dictionary of inputs for the WordApp
            version: Version of the WordApp to use (default: ^1.0 for latest minor version)
            
        Returns:
            Dictionary containing the WordApp response
        """
        url = f"{self.base_url}/released-app/{app_id}/run"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "inputs": inputs,
            "version": version
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            # Wordware returns streaming responses, we'll collect all chunks
            result = await self._collect_streaming_response(response)
            return result
    
    async def _collect_streaming_response(self, response: httpx.Response) -> Dict[str, Any]:
        """
        Collect and parse streaming response from Wordware
        
        Args:
            response: The HTTP response object
            
        Returns:
            Parsed response data
        """
        collected_data = []
        
        async for line in response.aiter_lines():
            if line.strip():
                try:
                    # Wordware sends JSON chunks
                    chunk = json.loads(line)
                    collected_data.append(chunk)
                except json.JSONDecodeError:
                    continue
        
        # Return the last chunk which typically contains the final output
        if collected_data:
            return collected_data[-1]
        
        return {}
    
    async def generate_aggregate_summary(
        self,
        app_id: str,
        transcripts: List[Dict[str, str]],
        research_question: str
    ) -> Dict[str, Any]:
        """
        Generate aggregate summary from multiple interview transcripts
        
        Args:
            app_id: The Wordware app ID for aggregate analysis
            transcripts: List of interview transcripts with Q&A pairs
            research_question: The research question being analyzed
            
        Returns:
            Dictionary containing statistics, pros, and cons
        """
        # Format transcripts for analysis
        formatted_transcripts = self._format_transcripts(transcripts)
        
        inputs = {
            "research_question": research_question,
            "transcripts": formatted_transcripts,
            "num_statistics": 5
        }
        
        result = await self.run_wordapp(app_id, inputs)
        return result
    
    def _format_transcripts(self, transcripts: List[Dict[str, str]]) -> str:
        """
        Format interview transcripts into a readable text format
        
        Args:
            transcripts: List of interview transcripts
            
        Returns:
            Formatted string of all transcripts
        """
        formatted = []
        
        for i, transcript in enumerate(transcripts, 1):
            formatted.append(f"=== Interview {i} ===")
            formatted.append(transcript.get("content", ""))
            formatted.append("")
        
        return "\n".join(formatted)


# Singleton instance
_wordware_client: Optional[WordwareClient] = None


def get_wordware_client() -> WordwareClient:
    """Get or create Wordware client singleton"""
    global _wordware_client
    if _wordware_client is None:
        _wordware_client = WordwareClient()
    return _wordware_client
