// =============================================================
// Blublublu — Homepage
// Alterna o tema claro/escuro (data-theme no <html>) e guarda a
// preferência no localStorage (chave 'blu-theme', padrão 'light').
// =============================================================
(function () {
    'use strict';

    var root = document.documentElement;
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;

    function currentTheme() {
        return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    btn.addEventListener('click', function () {
        var next = currentTheme() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        localStorage.setItem('blu-theme', next);
        btn.setAttribute('aria-label', next === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro');
    });

    btn.setAttribute('aria-label', currentTheme() === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro');
})();