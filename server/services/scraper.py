#!/usr/bin/env python3
import sys
import json
import requests
from bs4 import BeautifulSoup
import time
from urllib.parse import urljoin, urlparse
import argparse

def scrape_website(url, selectors, max_pages=10, delay=1):
    """
    Scrape website using provided CSS selectors
    
    Args:
        url: Target URL to scrape
        selectors: List of CSS selectors to extract data
        max_pages: Maximum number of pages to scrape
        delay: Delay between requests in seconds
    
    Returns:
        List of scraped data objects
    """
    results = []
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    })
    
    try:
        visited_urls = set()
        urls_to_visit = [url]
        pages_scraped = 0
        
        while urls_to_visit and pages_scraped < max_pages:
            current_url = urls_to_visit.pop(0)
            
            if current_url in visited_urls:
                continue
                
            visited_urls.add(current_url)
            
            # Add delay to be respectful
            if pages_scraped > 0:
                time.sleep(delay)
            
            response = session.get(current_url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract data using provided selectors
            page_data = {
                'url': current_url,
                'domain': urlparse(current_url).netloc,
                'title': soup.title.string if soup.title else '',
                'content': {}
            }
            
            # Apply each selector
            for i, selector in enumerate(selectors):
                try:
                    elements = soup.select(selector)
                    if elements:
                        # Extract text content from all matching elements
                        page_data['content'][f'selector_{i}'] = [
                            {
                                'text': elem.get_text(strip=True),
                                'html': str(elem),
                                'attributes': dict(elem.attrs) if elem.attrs else {}
                            } for elem in elements
                        ]
                    else:
                        page_data['content'][f'selector_{i}'] = []
                except Exception as e:
                    page_data['content'][f'selector_{i}'] = {'error': str(e)}
            
            results.append(page_data)
            pages_scraped += 1
            
            # Find additional URLs if we haven't reached max pages
            if pages_scraped < max_pages:
                links = soup.find_all('a', href=True)
                for link in links[:5]:  # Limit to avoid too many URLs
                    absolute_url = urljoin(current_url, link['href'])
                    if (urlparse(absolute_url).netloc == urlparse(url).netloc and 
                        absolute_url not in visited_urls and 
                        absolute_url not in urls_to_visit):
                        urls_to_visit.append(absolute_url)
        
        return {
            'success': True,
            'data': results,
            'pages_scraped': pages_scraped,
            'message': f'Successfully scraped {pages_scraped} pages'
        }
        
    except requests.RequestException as e:
        return {
            'success': False,
            'error': f'Request failed: {str(e)}',
            'data': results
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Scraping failed: {str(e)}',
            'data': results
        }

def test_selectors(url, selectors):
    """
    Test CSS selectors on a single page
    """
    try:
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        response = session.get(url, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        results = {}
        for i, selector in enumerate(selectors):
            try:
                elements = soup.select(selector)
                results[f'selector_{i}'] = {
                    'selector': selector,
                    'matches': len(elements),
                    'preview': [elem.get_text(strip=True)[:100] for elem in elements[:3]]
                }
            except Exception as e:
                results[f'selector_{i}'] = {
                    'selector': selector,
                    'error': str(e)
                }
        
        return {
            'success': True,
            'results': results,
            'page_title': soup.title.string if soup.title else '',
            'url': url
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'url': url
        }

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Web Scraper')
    parser.add_argument('--action', choices=['scrape', 'test'], required=True)
    parser.add_argument('--url', required=True)
    parser.add_argument('--selectors', required=True, help='JSON array of CSS selectors')
    parser.add_argument('--max-pages', type=int, default=10)
    parser.add_argument('--delay', type=float, default=1)
    
    args = parser.parse_args()
    
    try:
        selectors = json.loads(args.selectors)
        
        if args.action == 'scrape':
            result = scrape_website(args.url, selectors, args.max_pages, args.delay)
        else:  # test
            result = test_selectors(args.url, selectors)
            
        print(json.dumps(result))
        
    except json.JSONDecodeError:
        print(json.dumps({
            'success': False,
            'error': 'Invalid JSON format for selectors'
        }))
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e)
        }))
