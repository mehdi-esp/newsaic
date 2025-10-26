#!/usr/bin/env python3
"""
Exa.ai News Fetch CLI

Requirements:
- Install Exa: pip install exa-py
- Set your Exa API key as an environment variable:
    export EXA_API_KEY="your_api_key_here"
"""

import argparse
import json
import sys
import os
from exa_py import Exa


def main():
    parser = argparse.ArgumentParser(
        description="Fetch and optionally save news results from Exa.ai API as JSON."
    )

    parser.add_argument("query", help="Search query (e.g., 'AI in healthcare')")

    # When selected, also retrieves author, icon, and image
    parser.add_argument(
        "-t", "--text",
        action="store_true",
        help="Include full page text and metadata (disabled by default)"
    )

    # When selected, also retrieves author, icon, and image
    parser.add_argument(
        "-s", "--summary",
        action="store_true",
        help="Include AI-generated summaries of results (disabled by default)"
    )

    parser.add_argument(
        "-o", "--output",
        metavar="FILE",
        help="Optional JSON output file path. If omitted, prints to stdout."
    )

    args = parser.parse_args()

    api_key = os.getenv("EXA_API_KEY")
    if not api_key:
        print("Error: EXA_API_KEY environment variable not set.", file=sys.stderr)
        sys.exit(1)

    exa = Exa(api_key=api_key)

    print(f"Fetching news from Exa.ai for query '{args.query}'...", file=sys.stderr)

    # Determine which search method to use
    if args.text or args.summary:
        result = exa.search_and_contents(
            query=args.query,
            type="keyword",
            category="news",
            text=args.text,
            summary=args.summary,
        )
    else:
        result = exa.search(
            query=args.query,
            type="keyword",
            category="news",
        )

    # Convert Result objects to JSON-serializable dicts
    results = [{k: getattr(r, k) for k in r.__dict__} for r in result.results]
    json_output = json.dumps(results, indent=2, ensure_ascii=False)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(json_output)
        print(f"Results saved to {args.output}", file=sys.stderr)
    else:
        print(json_output)


if __name__ == "__main__":
    main()
