// Add any interactive features here
document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuButton && navLinks) {
        // Toggle menu when hamburger is clicked
        mobileMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenuButton.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking anywhere else on the page
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !mobileMenuButton.contains(e.target)) {
                mobileMenuButton.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });

        // Close menu when clicking a nav link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuButton.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // Close mobile menu when window is resized to desktop size
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            mobileMenuButton?.classList.remove('active');
            navLinks?.classList.remove('active');
        }
    });

    // Add active class to current page in navigation
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}); 