/* panic key — enabled via site settings (pu_panic=on).
   ` instantly swaps this tab to Google Classroom. */
document.addEventListener('keydown', (e) => {
    if (e.key === '`' && localStorage.getItem('pu_panic') === 'on')
        location.href = 'https://classroom.google.com';
});
