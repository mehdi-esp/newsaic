#!/usr/bin/env python3
"""
Tavily News Fetch CLI

Requirements:
- Install Tavily: pip install tavily
- Set your Tavily API key as an environment variable:
    export TAVILY_API_KEY="your_api_key_here"
"""

import argparse
import json
import sys
from tavily import TavilyClient


def main():
    parser = argparse.ArgumentParser(
        description="Fetch and optionally save news results from Tavily API as JSON."
    )

    parser.add_argument("query", help="Search query (e.g., 'AI in healthcare')")

    parser.add_argument(
        "-d", "--depth",
        choices=["basic", "advanced"],
        default="basic",
        help="Search depth (default: basic)"
    )

    parser.add_argument(
        "-m", "--max-results",
        type=int,
        default=10,
        help="Maximum number of results to return (default: 10)"
    )

    parser.add_argument(
        "-r", "--raw",
        choices=["markdown", "text", "none"],
        default="markdown",
        help="Include raw article content in 'markdown', 'text', or 'none' (default: markdown)"
    )

    parser.add_argument(
        "-t", "--time-range",
        choices=["day", "week", "month", "year"],
        default="day",
        help="Limit results by time range (default: day)"
    )

    parser.add_argument(
        "-o", "--output",
        metavar="FILE",
        help="Optional JSON output file path. If omitted, prints to stdout."
    )

    args = parser.parse_args()

    # Initialize Tavily client (requires TAVILY_API_KEY environment variable)
    client = TavilyClient()

    print("Fetching news from Tavily...", file=sys.stderr)

    # Include raw content only if not 'none'
    include_raw = False if args.raw == "none" else args.raw

    result = client.search(
        query=args.query,
        topic="news",
        search_depth=args.depth,
        time_range=args.time_range,
        max_results=args.max_results,
        include_raw_content=include_raw
    )

    json_output = json.dumps(result, indent=2, ensure_ascii=False)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(json_output)
        print(f"Results saved to {args.output}", file=sys.stderr)
    else:
        print(json_output)


if __name__ == "__main__":
    main()
