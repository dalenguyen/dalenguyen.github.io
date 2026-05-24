"""
Usage:
  python3 medium_post.py <path-to-post.md>

Publishes any blog post from apps/blog-app/src/content/ to Medium as a draft.
Images are resolved from libs/portfolio/shared/assets/images/blog/.
"""
import os, re, subprocess, sys, time
import markdown as md
from cloakbrowser import launch_persistent_context

REPO_ROOT   = "/Users/dalenguyen/projects/github/dalenguyen.github.io"
ASSETS_DIR  = os.path.join(REPO_ROOT, "libs/portfolio/shared/assets/images/blog")
PROFILE_DIR = os.path.expanduser("~/.cloakbrowser/medium-profile")

# --- CLI arg ---
if len(sys.argv) < 2:
    # Default to the most recent post if none given
    content_dir = os.path.join(REPO_ROOT, "apps/blog-app/src/content")
    posts = sorted(f for f in os.listdir(content_dir) if f.endswith(".md"))
    POST_PATH = os.path.join(content_dir, posts[-1])
    print(f"No post specified — using latest: {posts[-1]}")
else:
    POST_PATH = sys.argv[1]
    if not os.path.isabs(POST_PATH):
        POST_PATH = os.path.join(REPO_ROOT, POST_PATH)

# --- Parse frontmatter + body ---
with open(POST_PATH) as f:
    raw = f.read()

fm_match = re.match(r'^---\s*\n(.*?)\n---\s*\n', raw, re.DOTALL)
frontmatter = fm_match.group(1) if fm_match else ""
body = raw[fm_match.end():].strip() if fm_match else raw.strip()

def fm_get(key):
    m = re.search(rf'^{key}:\s*["\']?(.+?)["\']?\s*$', frontmatter, re.MULTILINE)
    return m.group(1).strip() if m else ""

TITLE = fm_get("title")
cover_url = fm_get("coverImage")   # e.g. https://dalenguyen.me/assets/images/blog/foo.png
categories = re.findall(r"'([^']+)'", fm_get("categories"))

# Resolve cover image to local path
def url_to_local(url):
    filename = url.split("/")[-1]
    path = os.path.join(ASSETS_DIR, filename)
    return path if os.path.exists(path) else None

HERO_IMAGE = url_to_local(cover_url) if cover_url else None

# --- Split body at each <figure> block, collecting (text_segment, image_path) pairs ---
# Result: [text, (text, img), (text, img), ..., text]
figure_re = re.compile(r'<figure>\s*<img[^>]+src="([^"]+)"[^>]*>.*?</figure>', re.DOTALL)

segments = []   # list of {"text": str, "image": str|None}
cursor = 0
for fig in figure_re.finditer(body):
    text_before = body[cursor:fig.start()].strip()
    img_src = fig.group(1)                    # e.g. assets/images/blog/foo.png
    img_filename = img_src.split("/")[-1]
    img_local = os.path.join(ASSETS_DIR, img_filename)
    segments.append({"text": text_before, "image": img_local if os.path.exists(img_local) else None})
    cursor = fig.end()

# Remaining text after last figure
remaining = body[cursor:].strip()
if remaining:
    segments.append({"text": remaining, "image": None})

if not segments:
    segments = [{"text": body, "image": None}]

print(f"Title      : {TITLE}")
print(f"Hero image : {HERO_IMAGE}")
print(f"Segments   : {len(segments)} (text+image pairs)")
print(f"Topics     : {categories}")

# --- Helpers ---
def paste_html(page, text):
    if not text.strip():
        return
    html = md.markdown(text, extensions=['fenced_code', 'tables'])
    page.evaluate("""([html, plain]) => {
        const body = document.querySelector('div.postArticle-content');
        if (body) {
            const walker = document.createTreeWalker(body, NodeFilter.SHOW_ALL);
            let last = body, node;
            while ((node = walker.nextNode())) last = node;
            const range = document.createRange();
            if (last.nodeType === Node.TEXT_NODE) {
                range.setStart(last, last.length);
            } else {
                range.selectNodeContents(last);
                range.collapse(false);
            }
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            body.focus();
        }
        const dt = new DataTransfer();
        dt.setData('text/html', html);
        dt.setData('text/plain', plain);
        document.activeElement.dispatchEvent(
            new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })
        );
    }""", [html, text])
    time.sleep(1.5)

def paste_image(page, image_path):
    if not image_path or not os.path.exists(image_path):
        print(f"  ⚠️  Image not found, skipping: {image_path}")
        return
    ext = os.path.splitext(image_path)[1].lower()
    apple_type = "«class PNGf»" if ext == ".png" else "JPEG picture"
    subprocess.run([
        'osascript', '-e',
        f'set the clipboard to (read (POSIX file "{image_path}") as {apple_type})'
    ], check=True)
    time.sleep(0.5)
    page.keyboard.press('Meta+v')
    time.sleep(2)

# --- Launch browser ---
os.makedirs(PROFILE_DIR, exist_ok=True)
context = launch_persistent_context(PROFILE_DIR, headless=False)
page = context.new_page()

print("Opening Medium editor...")
page.goto('https://medium.com/new-story')
time.sleep(4)

if page.locator('a[href*="signin"], a[href*="login"]').count() > 0:
    print("⚠️  Please log in to Medium. Waiting 120s...")
    try:
        page.wait_for_url(lambda u: 'signin' not in u and 'login' not in u, timeout=120000)
    except:
        pass
    time.sleep(2)

# --- 1. Title ---
print("Typing title...")
page.locator('h3[data-testid="storyTitle"], h3.graf--title, h3').first.click()
time.sleep(0.3)
page.keyboard.type(TITLE)
time.sleep(0.5)
page.keyboard.press('Enter')
time.sleep(1)

# --- 2. Hero image ---
if HERO_IMAGE:
    print(f"Pasting hero image: {os.path.basename(HERO_IMAGE)}")
    paste_image(page, HERO_IMAGE)
    page.keyboard.press('Enter')
    time.sleep(0.5)

# --- 3. Body segments (text → inline image → text → ...) ---
for i, seg in enumerate(segments):
    if seg["text"]:
        print(f"Pasting text segment {i+1}/{len(segments)}...")
        paste_html(page, seg["text"])
    if seg["image"]:
        print(f"Pasting inline image: {os.path.basename(seg['image'])}")
        page.keyboard.press('Enter')
        time.sleep(0.5)
        paste_image(page, seg["image"])
        page.keyboard.press('Enter')
        time.sleep(0.5)

print(f"\n✅ Draft ready. Suggested topics: {', '.join(categories)}")
print("Keeping browser open for 10 minutes...")
time.sleep(600)
context.close()
