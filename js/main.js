// Add any interactive features here
document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu functionality
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileNavLinks = document.querySelector('.nav-links');
    
    if (mobileMenuButton && mobileNavLinks) {
        // Toggle mobile menu
        mobileMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenuButton.classList.toggle('active');
            mobileNavLinks.classList.toggle('active');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (event) => {
            const isClickInsideMenu = mobileNavLinks.contains(event.target);
            const isClickOnButton = mobileMenuButton.contains(event.target);
            
            if (!isClickInsideMenu && !isClickOnButton && mobileNavLinks.classList.contains('active')) {
                mobileMenuButton.classList.remove('active');
                mobileNavLinks.classList.remove('active');
            }
        });

        // Close mobile menu when window is resized
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                mobileMenuButton.classList.remove('active');
                mobileNavLinks.classList.remove('active');
            }
        });
    }

    // Add active class to current page in navigation
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
}); 