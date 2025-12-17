# Personal Portfolio - Vivek

A clean, modern portfolio website showcasing technical projects and analytical work.

## 🚀 Quick Deploy to GitHub Pages

### Step 1: Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `yourusername.github.io` (replace `yourusername` with your actual GitHub username)
3. Make it public
4. Don't initialize with README (we already have files)

### Step 2: Upload Files
You can either use Git or GitHub's web interface:

#### Option A: Using Git (Recommended)
```bash
# Navigate to your project folder
cd path/to/portfolio

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial portfolio commit"

# Add remote (replace with your username)
git remote add origin https://github.com/yourusername/yourusername.github.io.git

# Push to GitHub
git branch -M main
git push -u origin main
```

#### Option B: Using GitHub Web Interface
1. Go to your new repository
2. Click "uploading an existing file"
3. Drag and drop all three files: `index.html`, `styles.css`, `script.js`
4. Commit the changes

### Step 3: Enable GitHub Pages
1. Go to your repository Settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "main" branch
4. Click Save
5. Your site will be live at `https://yourusername.github.io` in a few minutes!

## ✏️ Customization Guide

### Update Personal Information

**In `index.html`, search and replace:**

1. **Links** (lines with `href` attributes):
   - `https://github.com/yourusername` → Your actual GitHub profile
   - `https://linkedin.com/in/yourprofile` → Your LinkedIn profile
   - `your.email@example.com` → Your actual email

2. **Name and Content**:
   - `VK` in the logo → Your initials
   - Update project descriptions with your actual work
   - Modify the hero description to match your background
   - Update the About section with your story

3. **Projects**:
   - Add/remove project cards as needed
   - Update tech stacks for each project
   - Add GitHub links to projects if available

### Styling Customizations

**In `styles.css`:**

1. **Colors** (at the top in `:root`):
   ```css
   --accent-primary: #00e5a0;    /* Main accent color */
   --accent-secondary: #00b8d4;  /* Secondary accent */
   --bg-primary: #0a0a0f;        /* Main background */
   ```

2. **Typography**:
   - Change fonts in the Google Fonts link (in `index.html` head)
   - Update `font-family` values in CSS

3. **Layout**:
   - Adjust `max-width` values for different content widths
   - Modify spacing with padding/margin values

## 📁 File Structure

```
├── index.html      # Main HTML structure
├── styles.css      # All styling and animations
├── script.js       # Interactive features
└── README.md       # This file
```

## 🎨 Design Features

- **Dark theme** with teal/cyan accents
- **Smooth scroll animations** reveal content as you scroll
- **Responsive design** works on mobile, tablet, and desktop
- **Interactive elements** hover effects and parallax scrolling
- **Performance optimized** minimal external dependencies

## 🛠️ Tech Stack

- Pure HTML5, CSS3, and JavaScript (no frameworks)
- Google Fonts (JetBrains Mono and Lexend)
- CSS Grid and Flexbox for layouts
- Intersection Observer API for scroll animations

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔧 Local Development

To test locally:
1. Open `index.html` directly in a browser, or
2. Use a local server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (with npx)
   npx serve
   ```
3. Visit `http://localhost:8000`

## 🚀 Next Steps

Consider adding:
- Custom domain (Settings → Pages → Custom domain)
- Google Analytics for traffic tracking
- Contact form using Formspree or similar
- Blog section for articles
- Dark/light mode toggle
- More projects as you build them

## 📝 License

Feel free to use this template for your own portfolio. No attribution required.

---

**Need help?** Check the [GitHub Pages documentation](https://docs.github.com/en/pages) or open an issue in your repository.
