import logging
from typing import List, Dict

logger = logging.getLogger("service.search")


class SearchService:
    def search(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
        """Search using both news and web results, prioritising recent content."""
        try:
            from duckduckgo_search import DDGS

            ddgs = DDGS()
            combined: List[Dict[str, str]] = []
            seen_urls: set = set()

            # 1) News search first – best for current events
            try:
                news_raw = list(ddgs.news(query, max_results=max_results, timelimit="w"))
                logger.info(f"News search for '{query}' returned {len(news_raw)} results")
                for r in news_raw:
                    url = r.get("url", "")
                    if url and url not in seen_urls:
                        seen_urls.add(url)
                        combined.append({
                            "title": r.get("title", ""),
                            "url": url,
                            "snippet": r.get("body", ""),
                            "date": r.get("date", ""),
                            "source": r.get("source", ""),
                        })
            except Exception as exc:
                logger.warning(f"News search failed, falling back to text: {exc}")

            # 2) Text search with recent time limit to fill remaining slots
            remaining = max_results - len(combined)
            if remaining > 0:
                try:
                    text_raw = list(ddgs.text(query, max_results=remaining + 2, timelimit="w"))
                    logger.info(f"Text search for '{query}' returned {len(text_raw)} results")
                    for r in text_raw:
                        url = r.get("href", "")
                        if url and url not in seen_urls:
                            seen_urls.add(url)
                            combined.append({
                                "title": r.get("title", ""),
                                "url": url,
                                "snippet": r.get("body", ""),
                                "date": "",
                                "source": "",
                            })
                            if len(combined) >= max_results:
                                break
                except Exception as exc:
                    logger.warning(f"Text search also failed: {exc}")

            # 3) If still no results, try text without time limit as last resort
            if not combined:
                try:
                    fallback_raw = list(ddgs.text(query, max_results=max_results))
                    logger.info(f"Fallback search for '{query}' returned {len(fallback_raw)} results")
                    for r in fallback_raw:
                        combined.append({
                            "title": r.get("title", ""),
                            "url": r.get("href", ""),
                            "snippet": r.get("body", ""),
                            "date": "",
                            "source": "",
                        })
                except Exception as exc:
                    logger.warning(f"Fallback search failed: {exc}")

            if not combined:
                return [{"title": "No results", "url": "", "snippet": "No search results found.", "date": "", "source": ""}]

            logger.info(f"Total combined results for '{query}': {len(combined)}")
            return combined[:max_results]

        except Exception as exc:
            logger.exception(f"Web search failed for query: {query}")
            return [{"title": "Search Error", "url": "", "snippet": f"Search failed: {exc}", "date": "", "source": ""}]

    def format_for_context(self, results: List[Dict[str, str]]) -> str:
        if not results:
            return ""
        lines = [
            "The user has web search enabled. Below are web search results for their query.",
            "Use these results to inform your answer. Cite sources when relevant.",
            "",
            "[Web Search Results]",
        ]
        for i, r in enumerate(results, 1):
            lines.append(f"{i}. {r['title']}")
            if r.get("snippet"):
                lines.append(f"   {r['snippet']}")
            if r.get("url"):
                lines.append(f"   Source: {r['url']}")
        lines.append("[End Search Results]")
        lines.append("")
        return "\n".join(lines)
