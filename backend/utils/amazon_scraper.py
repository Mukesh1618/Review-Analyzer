import os
import sys
import json
import time
import argparse
import re
from playwright.sync_api import sync_playwright

def parse_args():
    parser = argparse.ArgumentParser(description="Scrape customer reviews from an Amazon product page using Playwright.")
    parser.add_argument("--url", type=str, required=True, help="Amazon product page URL or ASIN.")
    parser.add_argument("--limit", type=int, default=50, help="Maximum number of reviews to extract (default: 50).")
    parser.add_argument("--headed", action="store_true", help="Run the browser in headed mode (visible). Highly recommended to bypass CAPTCHAs.")
    parser.add_argument("--output-json", type=str, default=None, help="Custom output JSON path (default: autosaved in docs/sample_files/).")
    parser.add_argument("--output-txt", type=str, default=None, help="Custom output TXT path (default: autosaved in docs/sample_files/).")
    return parser.parse_args()

def extract_asin(url):
    """Tries to extract ASIN from standard Amazon URLs."""
    if not url:
        return None
    # If the user just passed a 10-character alphanumeric ASIN
    if len(url.strip()) == 10 and url.strip().isalnum():
        return url.strip().upper()
    asin_match = re.search(r'/dp/([A-Z0-9]{10})', url, re.IGNORECASE) or re.search(r'/product/([A-Z0-9]{10})', url, re.IGNORECASE) or re.search(r'/product-reviews/([A-Z0-9]{10})', url, re.IGNORECASE)
    if asin_match:
        return asin_match.group(1).upper()
    return None

def clean_text(text):
    if not text:
        return ""
    return text.strip().replace("\n", " ")

def run_scraper():
    args = parse_args()
    
    # Resolve product ID/ASIN for file naming
    asin = extract_asin(args.url)
    product_id = asin if asin else "scraped_product"
    
    # Establish default output directories
    os.makedirs(os.path.join("docs", "sample_files"), exist_ok=True)
    json_path = args.output_json or os.path.join("docs", "sample_files", f"amazon_{product_id}_reviews.json")
    txt_path = args.output_txt or os.path.join("docs", "sample_files", f"amazon_{product_id}_reviews.txt")
    
    # Normalise URL to product detail page if it is an ASIN
    target_url = args.url
    if asin:
        target_url = f"https://www.amazon.com/dp/{asin}"
        print(f"Normalised target to product detail URL: {target_url}")

    reviews_data = []
    
    print("\n[Playwright] Initialising browser automation...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=not args.headed,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox"
            ]
        )
        
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 800}
        )
        
        page = context.new_page()
        page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        print("Connecting to Amazon...")
        page.goto(target_url, wait_until="domcontentloaded", timeout=60000)
        time.sleep(3)
        
        # ADVANCED BOT DETECTION AND BYPASS
        bot_check = True
        attempts = 0
        max_attempts = 3
        
        while bot_check and attempts < max_attempts:
            has_captcha = page.locator("input#captchacharacters").count() > 0 or "Robot Check" in page.title()
            has_continue_button = page.locator("text=Continue shopping").count() > 0 or page.locator("a:has-text('Continue shopping')").count() > 0 or page.locator("button:has-text('Continue shopping')").count() > 0
            is_generic_title = page.title() == "Amazon.com" and page.locator("#productTitle").count() == 0 and page.locator("[data-hook='review']").count() == 0
            
            if has_captcha or has_continue_button or is_generic_title:
                attempts += 1
                print(f"\n[Warning] Bot verification page detected (Attempt {attempts} of {max_attempts}).")
                
                # Try auto-clicking the "Continue shopping" button
                continue_btn = page.locator("text=Continue shopping").first
                if has_continue_button and continue_btn.count() > 0:
                    print("Attempting to auto-click the 'Continue shopping' button...")
                    try:
                        continue_btn.click()
                        time.sleep(4)
                        continue
                    except Exception as e:
                        print(f"Auto-click failed: {e}")
                
                if not args.headed:
                    print("Error: Running in HEADLESS mode! E-commerce bot verification cannot be resolved blindly.")
                    print("Action: Please rerun the command with the '--headed' flag so you can view and solve it.")
                    browser.close()
                    sys.exit(1)
                else:
                    print("\n>>> MANUAL ACTION REQUIRED <<<")
                    print("Please solve the verification / click 'Continue shopping' in the open browser window.")
                    print("Once the Amazon page loads successfully, press ENTER here in this console to resume...")
                    input()
                    time.sleep(2)
            else:
                bot_check = False
        
        # Extract product title
        product_title = "Amazon Scraped Product"
        product_title_el = page.locator("#productTitle")
        if product_title_el.count() > 0:
            product_title = clean_text(product_title_el.first.inner_text())
        elif page.locator("[data-hook='product-link']").count() > 0:
            product_title = clean_text(page.locator("[data-hook='product-link']").first.inner_text())
            
        print(f"Product Identified: {product_title}")
        
        # If we are on the main product detail page, navigate to the "See all reviews" page
        if "/product-reviews/" not in page.url:
            print("Locating link to 'All Reviews' list page...")
            all_reviews_link = page.locator("a[data-hook='see-all-reviews-link-foot']")
            
            # Fallbacks for finding reviews list link
            if all_reviews_link.count() == 0:
                all_reviews_link = page.locator("a[href*='/product-reviews/']")
            if all_reviews_link.count() == 0:
                all_reviews_link = page.locator("a:has-text('See all customer reviews')")
                
            if all_reviews_link.count() > 0:
                reviews_href = all_reviews_link.first.get_attribute("href")
                if reviews_href:
                    if not reviews_href.startswith("http"):
                        reviews_href = "https://www.amazon.com" + reviews_href
                    # Force sort by recent to get fresh data
                    if "?" in reviews_href:
                        reviews_href += "&sortBy=recent"
                    else:
                        reviews_href += "?sortBy=recent"
                    print(f"Navigating to All Reviews page: {reviews_href}")
                    page.goto(reviews_href, wait_until="domcontentloaded", timeout=60000)
                    time.sleep(3)
            else:
                print("Could not find 'See all reviews' link. Attempting to parse top reviews on this page...")
        
        page_num = 1
        while len(reviews_data) < args.limit:
            print(f"\nScraping page {page_num}... (Currently collected: {len(reviews_data)})")
            
            page.evaluate("window.scrollTo(0, document.body.scrollHeight * 0.6);")
            time.sleep(2.0)
            
            review_cards = page.locator("[data-hook='review']")
            card_count = review_cards.count()
            
            if card_count == 0:
                print("No reviews found on this page. Stopping scrape or page limit reached.")
                break
                
            for i in range(card_count):
                if len(reviews_data) >= args.limit:
                    break
                    
                card = review_cards.nth(i)
                
                try:
                    rating_el = card.locator("[data-hook='review-star-rating'], [data-hook='cmps-review-star-rating']")
                    rating_text = "N/A"
                    if rating_el.count() > 0:
                        rating_text = rating_el.first.inner_text()
                    
                    title_el = card.locator("[data-hook='review-title']")
                    title = "N/A"
                    if title_el.count() > 0:
                        title = title_el.first.inner_text()
                        title = re_clean_title(title)
                        
                    body_el = card.locator("[data-hook='review-body']")
                    body = ""
                    if body_el.count() > 0:
                        body = body_el.first.inner_text()
                        
                    date_el = card.locator("[data-hook='review-date']")
                    date_text = "N/A"
                    if date_el.count() > 0:
                        date_text = date_el.first.inner_text()
                        
                    reviewer = "Anonymous"
                    reviewer_el = card.locator(".a-profile-name")
                    if reviewer_el.count() > 0:
                        reviewer = reviewer_el.first.inner_text()
                        
                    clean_body = clean_text(body)
                    
                    if clean_body:
                        reviews_data.append({
                            "reviewer": clean_text(reviewer),
                            "rating": clean_text(rating_text),
                            "title": clean_text(title),
                            "date": clean_text(date_text),
                            "text": clean_body
                        })
                except Exception as e:
                    print(f"Warning: Skipped a review card due to parse error: {e}")
                    
            # Try to paginate
            next_btn = page.locator("li.a-last a")
            if next_btn.count() > 0 and len(reviews_data) < args.limit:
                print("Clicking Next Page...")
                try:
                    next_btn.first.click()
                    page_num += 1
                    time.sleep(3.0)
                except Exception as e:
                    print(f"Failed to click next button: {e}. Stopping.")
                    break
            else:
                print("No further pages or limit reached.")
                break
                
        browser.close()

    # Save to files
    if reviews_data:
        export_payload = {
            "product_name": product_title,
            "device": product_title,
            "asin": asin,
            "reviews": reviews_data
        }
        with open(json_path, "w", encoding="utf-8") as jf:
            json.dump(export_payload, jf, indent=2, ensure_ascii=False)
            
        with open(txt_path, "w", encoding="utf-8") as tf:
            for rev in reviews_data:
                tf.write(f"{rev['text']}\n")
                
        print(f"\n==================================================")
        print(f"Scraping completed successfully!")
        print(f"Collected: {len(reviews_data)} reviews")
        print(f"JSON Dataset: {json_path}")
        print(f"Plain TXT Dataset: {txt_path}")
        print(f"==================================================")
    else:
        print("\nScraping finished but no reviews were extracted.")

def re_clean_title(title_text):
    """Helper to clean prepended star rating out of titles on Amazon."""
    if not title_text:
        return ""
    cleaned = re.sub(r'^\d+(\.\d+)? out of 5 stars\s*', '', title_text)
    return cleaned.strip()

if __name__ == "__main__":
    run_scraper()
