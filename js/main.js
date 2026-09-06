// =============================================================
// Blublublu — Homepage
// Consulta a release mais recente do app no GitHub e exibe o
// botão de download. Configure as constantes com o repositório
// público que publica as releases do app.
// =============================================================
(function () {
    'use strict';

    // --- Configuração ------------------------------------------------
    var OWNER = 'awsmsir'; // dono do repositório blu-home
    var REPO = 'blu-home'; // repositório público que hospeda a homepage e as releases do app
    var CURRENT_VERSION = '0.1.0'; // versão atual do app
    var ASSET_KEY = 'AppImage'; // substring do asset instalável a usar

    var api = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/releases/latest';

    var el = {
        badge: document.getElementById('ver-badge'),
        current: document.getElementById('ver-current'),
        latest: document.getElementById('ver-latest'),
        notes: document.getElementById('ver-notes'),
        actions: document.getElementById('ver-actions'),
        hint: document.getElementById('ver-hint'),
    };

    // --- Utilitários ------------------------------------------------
    function parseVersion(input) {
        var m = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(input || ''));
        if (!m) return null;
        return [Number(m[1]), Number(m[2]), Number(m[3])];
    }

    function isNewer(aInput, bInput) {
        var a = parseVersion(aInput);
        var b = parseVersion(bInput);
        if (!a || !b) return false;
        for (var i = 0; i < 3; i++) {
            if (a[i] > b[i]) return true;
            if (a[i] < b[i]) return false;
        }
        return false;
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // --- Render ------------------------------------------------------
    function buildDownloadButton(release) {
        if (!release) {
            // Sem release mais nova: apenas o botão de re-verificar.
            addGhost();
            return;
        }

        var asset = null;
        if (release.assets && release.assets.length) {
            var key = ASSET_KEY.toLowerCase();
            for (var i = 0; i < release.assets.length; i++) {
                var name = (release.assets[i].name || '').toLowerCase();
                if (name.indexOf(key) !== -1) {
                    asset = release.assets[i];
                    break;
                }
            }
            if (!asset) asset = release.assets[0]; // fallback: primeiro asset
        }

        var a = document.createElement('a');
        a.className = 'btn btn--primary';
        a.textContent = asset
            ? 'Baixar ' + release.tag_name
            : 'Baixar nova versão';
        a.href = asset ? asset.browser_download_url : release.html_url;
        a.target = '_blank';
        a.rel = 'noopener';
        el.actions.appendChild(a);

        addGhost();
    }

    function addGhost() {
        var ghost = document.createElement('button');
        ghost.className = 'btn btn--ghost';
        ghost.textContent = 'Verificar novamente';
        ghost.addEventListener('click', check);
        el.actions.appendChild(ghost);
    }

    function setBadge(label, kind) {
        el.badge.textContent = label;
        el.badge.className = 'badge badge--' + kind;
    }

    // --- Estados -----------------------------------------------------
    function stateChecking() {
        el.latest.textContent = '…';
        el.notes.textContent = '';
        el.hint.textContent = '';
        el.actions.innerHTML = '';
        setBadge('Verificando…', 'checking');
    }

    function stateUpToDate() {
        setBadge('Você está na versão mais recente', 'ok');
        buildDownloadButton(null);
    }

    function stateNewVersion(release) {
        el.latest.textContent = release.tag_name;
        el.notes.textContent = release.body || '';
        setBadge('Nova versão disponível', 'new');
        buildDownloadButton(release);
        el.hint.textContent = 'Baixe e instale a nova versão para continuar usando o app.';
    }

    function stateSameVersion(release) {
        el.latest.textContent = release.tag_name;
        el.notes.textContent = release.body || '';
        setBadge('Esta é a versão mais recente', 'ok');
        buildDownloadButton(null);
    }

    function stateError(err) {
        setBadge('Não foi possível verificar', 'new');
        el.hint.textContent = 'Erro ao consultar o GitHub: ' + (err && err.message ? err.message : err);
        buildDownloadButton(null);
    }

    // --- Checagem ----------------------------------------------------
    function check() {
        stateChecking();
        fetch(api, { headers: { Accept: 'application/vnd.github+json' } })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (release) {
                if (isNewer(release.tag_name, CURRENT_VERSION)) {
                    stateNewVersion(release);
                } else {
                    stateSameVersion(release);
                }
            })
            .catch(stateError);
    }

    document.addEventListener('DOMContentLoaded', function () {
        el.current.textContent = CURRENT_VERSION;
        var year = document.getElementById('year');
        if (year) year.textContent = new Date().getFullYear();
        check();
    });
})();