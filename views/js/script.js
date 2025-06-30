// DOM elements
const storyCards = document.querySelectorAll(".story-card");
const generateBtn = document.querySelector(".btn-primary");
const seeHowBtn = document.querySelector(".btn-secondary");
const navLinks = document.querySelectorAll(".nav-link");
const loginBtn = document.querySelector(".login-btn");

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeAnimations();
  setupEventListeners();
  setupScrollEffects();
});

// Initialize animations and effects
function initializeAnimations() {
  // Animate story cards on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  // Observe story cards for animation
  storyCards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    card.style.transition = `opacity 0.6s ease ${
      index * 0.1
    }s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
  });

  // Animate hero section
  animateHeroSection();
}

// Setup event listeners
function setupEventListeners() {
  // Story generation button
  generateBtn.addEventListener("click", handleGenerateStory);

  // See how it works button
  seeHowBtn.addEventListener("click", handleSeeHowItWorks);

  // Story card interactions
  storyCards.forEach((card) => {
    card.addEventListener("click", handleStoryCardClick);
    card.addEventListener("mouseenter", handleStoryCardHover);
    card.addEventListener("mouseleave", handleStoryCardLeave);
  });

  // Navigation links - only handle non-redirect links
  navLinks.forEach((link) => {
    link.addEventListener("click", handleNavClick);
  });

  // Mobile menu toggle (if needed)
  setupMobileMenu();
}

// Handle story generation
function handleGenerateStory() {
  // Add loading animation
  const originalText = generateBtn.textContent;
  generateBtn.textContent = "✨ Generating...";
  generateBtn.disabled = true;

  // Simulate story generation
  setTimeout(() => {
    showStoryModal();
    generateBtn.textContent = originalText;
    generateBtn.disabled = false;
  }, 2000);
}

// Handle see how it works
function handleSeeHowItWorks() {
  // Smooth scroll to teaching stories section
  const teachingSection = document.querySelector(".stories-section");
  teachingSection.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  // Highlight the section briefly
  teachingSection.style.background =
    "linear-gradient(45deg, transparent, rgba(37, 99, 235, 0.05), transparent)";
  setTimeout(() => {
    teachingSection.style.background = "transparent";
  }, 2000);
}

// Handle story card clicks
function handleStoryCardClick(event) {
  const card = event.currentTarget;
  const img = card.querySelector("img");
  const alt = img.alt;

  // Create story preview
  showStoryPreview(alt, img.src);
}

// Handle story card hover effects
function handleStoryCardHover(event) {
  const card = event.currentTarget;
  const img = card.querySelector("img");

  // Add scale effect
  img.style.transform = "scale(1.05)";
  img.style.transition = "transform 0.3s ease";
}

function handleStoryCardLeave(event) {
  const card = event.currentTarget;
  const img = card.querySelector("img");

  // Reset scale
  img.style.transform = "scale(1)";
}

// Handle navigation clicks
function handleNavClick(event) {
  const text = event.target.textContent;
  const href = event.target.getAttribute("href");

  // Only prevent default for hash links, let actual page links work
  if (href === "#") {
    event.preventDefault();

    switch (text) {
      case "Child Interface":
        showModal(
          "Child Interface",
          "A kid-friendly interface would be available here."
        );
        break;
      case "Parent Interface":
        showModal(
          "Parent Interface",
          "A parent control interface would be available here."
        );
        break;
      case "About us":
        showModal(
          "About Us",
          "Learn more about our AI-driven storytelling platform."
        );
        break;
      default:
        // Smooth scroll to top for Home if it's a hash link
        if (text === "Home") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }
  }
  // For actual page links (like generate-story.html, favorites.html), let them work normally
}

// Setup scroll effects
function setupScrollEffects() {
  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector(".hero");

    if (parallax) {
      const speed = scrolled * 0.5;
      parallax.style.transform = `translateY(${speed}px)`;
    }

    // Update navigation background opacity
    const header = document.querySelector(".header");
    if (scrolled > 100) {
      header.style.background =
        "linear-gradient(135deg, rgba(37, 99, 235, 0.95), rgba(124, 58, 237, 0.95), rgba(236, 72, 153, 0.95))";
      header.style.backdropFilter = "blur(10px)";
    } else {
      header.style.background =
        "linear-gradient(135deg, #2563eb, #7c3aed, #ec4899)";
      header.style.backdropFilter = "none";
    }
  });
}

// Animate hero section
function animateHeroSection() {
  const heroText = document.querySelector(".hero-text h1");
  const heroDescription = document.querySelector(".hero-text p");
  const heroImage = document.querySelector(".hero-image img");

  // Animate text
  if (heroText) {
    heroText.style.opacity = "0";
    heroText.style.transform = "translateY(50px)";

    setTimeout(() => {
      heroText.style.transition = "opacity 1s ease, transform 1s ease";
      heroText.style.opacity = "1";
      heroText.style.transform = "translateY(0)";
    }, 500);
  }

  if (heroDescription) {
    heroDescription.style.opacity = "0";
    heroDescription.style.transform = "translateY(30px)";

    setTimeout(() => {
      heroDescription.style.transition = "opacity 1s ease, transform 1s ease";
      heroDescription.style.opacity = "1";
      heroDescription.style.transform = "translateY(0)";
    }, 800);
  }

  if (heroImage) {
    heroImage.style.opacity = "0";
    heroImage.style.transform = "scale(0.8)";

    setTimeout(() => {
      heroImage.style.transition = "opacity 1s ease, transform 1s ease";
      heroImage.style.opacity = "1";
      heroImage.style.transform = "scale(1)";
    }, 1000);
  }
}

// Setup mobile menu
function setupMobileMenu() {
  // Add mobile menu button if screen is small
  if (window.innerWidth <= 768) {
    const nav = document.querySelector(".nav");
    const navLinks = document.querySelector(".nav-links");

    // Create mobile menu button
    const mobileMenuBtn = document.createElement("button");
    mobileMenuBtn.innerHTML = "☰";
    mobileMenuBtn.className = "mobile-menu-btn";
    mobileMenuBtn.style.cssText = `
            display: block;
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            position: absolute;
            right: 2rem;
            top: 50%;
            transform: translateY(-50%);
        `;

    nav.appendChild(mobileMenuBtn);

    // Toggle mobile menu
    mobileMenuBtn.addEventListener("click", () => {
      navLinks.style.display =
        navLinks.style.display === "none" ? "flex" : "none";
    });
  }
}

// Show modal utility function
function showModal(title, content) {
  // Create modal overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

  // Create modal content
  const modal = document.createElement("div");
  modal.style.cssText = `
        background: white;
        padding: 2rem;
        border-radius: 1rem;
        max-width: 500px;
        width: 90%;
        text-align: center;
        transform: scale(0.8);
        transition: transform 0.3s ease;
    `;

  modal.innerHTML = `
        <h2 style="margin-bottom: 1rem; color: #1f2937;">${title}</h2>
        <p style="margin-bottom: 2rem; color: #6b7280;">${content}</p>
        <button style="
            background: #2563eb;
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-weight: 600;
        ">Close</button>
    `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Animate modal appearance
  setTimeout(() => {
    overlay.style.opacity = "1";
    modal.style.transform = "scale(1)";
  }, 10);

  // Close modal functionality
  const closeBtn = modal.querySelector("button");
  const closeModal = () => {
    overlay.style.opacity = "0";
    modal.style.transform = "scale(0.8)";
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 300);
  };

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });
}

// Show story preview
function showStoryPreview(title, imageSrc) {
  const content = `
        <img src="${imageSrc}" alt="${title}" style="
            width: 100%;
            max-width: 300px;
            height: 200px;
            object-fit: cover;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
        ">
        <p>This ${title.toLowerCase()} would contain an engaging story. Click "Generate Story Idea" to create your own!</p>
    `;

  showModal(title, content);
}

// Show story modal with generated content
function showStoryModal() {
  const stories = [
    "Once upon a time, in a magical kingdom where books could talk...",
    "In a world where colors had feelings, a young artist discovered...",
    "Deep in the ocean, a curious dolphin found a mysterious treasure...",
    "High in the mountains, a brave eagle learned the value of friendship...",
  ];

  const randomStory = stories[Math.floor(Math.random() * stories.length)];
  showModal("Your Generated Story", randomStory);
}

// Add some interactive features for better UX
document.addEventListener("keydown", function (e) {
  // Press 'G' to go to generate story page
  if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.altKey) {
    const activeElement = document.activeElement;
    if (
      activeElement.tagName !== "INPUT" &&
      activeElement.tagName !== "TEXTAREA"
    ) {
      window.location.href = "generate-story.html";
    }
  }

  // Press 'Escape' to close any open modals
  if (e.key === "Escape") {
    const modals = document.querySelectorAll('[style*="z-index: 1000"]');
    modals.forEach((modal) => {
      if (modal.parentNode) {
        modal.click();
      }
    });
  }
});

// Add loading states and feedback
function addLoadingState(element, text = "Loading...") {
  const originalText = element.textContent;
  const originalDisabled = element.disabled;

  element.textContent = text;
  element.disabled = true;
  element.style.opacity = "0.7";

  return () => {
    element.textContent = originalText;
    element.disabled = originalDisabled;
    element.style.opacity = "1";
  };
}

// Initialize lazy loading for images
function initializeLazyLoading() {
  const images = document.querySelectorAll('img[src*="unsplash"]');

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.style.opacity = "0";
        img.style.transition = "opacity 0.3s ease";

        img.onload = () => {
          img.style.opacity = "1";
        };

        observer.unobserve(img);
      }
    });
  });

  images.forEach((img) => imageObserver.observe(img));
}

// Initialize lazy loading when DOM is ready
document.addEventListener("DOMContentLoaded", initializeLazyLoading);
