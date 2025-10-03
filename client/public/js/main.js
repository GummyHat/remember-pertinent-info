// Self-invoking function to avoid polluting the global scope
(function() {
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Function to set the theme and save the preference
    const setTheme = (isDark) => {
        if (isDark) {
            body.classList.add('dark-mode');
            themeToggle.textContent = '☀️'; // Sun icon for light mode
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            themeToggle.textContent = '🌙'; // Moon icon for dark mode
            localStorage.setItem('theme', 'light');
        }
    };

    // Event listener for the toggle button
    themeToggle.addEventListener('click', () => {
        const isDarkMode = body.classList.contains('dark-mode');
        setTheme(!isDarkMode);
    });

    // Check for saved theme in localStorage, or use system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        setTheme(true);
    } else {
        setTheme(false);
    }
})();
