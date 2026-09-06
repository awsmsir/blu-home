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

    // Plataformas suportadas e como reconhecer os assets de cada uma na release.
    var PLATFORMS = [
        { key: 'windows', label: 'Windows', match: /\.(exe|msi|msix|appx)$/i, extra: 'setup' },
        { key: 'macos', label: 'macOS', match: /\.(dmg|pkg)$/i, extra: 'dmg' },
        { key: 'linux', label: 'Linux', match: /\.(appimage|deb|rpm)$/i, extra: 'appimage' },
    ];
    // Metadados gerados pelo electron-builder (vetor de assinatura etc.) — ignorar.
    var IGNORE_ASSET = /\.(blockmap|sha256|sha512|yml|yaml)$/i;
    // Links automáticos de changelog incluídos no corpo da release — não exibir.
    var IGNORE_NOTE_LINE = /^\s*#*\s*\*{0,2}Full Changelog\*{0,2}:.*$/im;

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

    // --- Multiplataforma -------------------------------------------
    function detectPlatform() {
        var plat = String(navigator.platform || '').toLowerCase();
        var ua = navigator.userAgent.toLowerCase();
        if (plat.indexOf('win') === 0 || ua.indexOf('windows') !== -1) return 'windows';
        if (plat.indexOf('mac') === 0 || ua.indexOf('mac') !== -1) return 'macos';
        return 'linux';
    }

    // Melhor asset disponível de uma plataforma: prefere 'extra' (ex.: .dmg no macOS).
    function pickAsset(assets, platform) {
        var meta = null;
        for (var p = 0; p < PLATFORMS.length; p++) {
            if (PLATFORMS[p].key === platform) {
                meta = PLATFORMS[p];
                break;
            }
        }
        if (!meta || !assets) return null;

        var best = null;
        for (var i = 0; i < assets.length; i++) {
            var name = assets[i].name || '';
            if (IGNORE_ASSET.test(name)) continue;
            if (!meta.match.test(name)) continue;
            if (!best) {
                best = assets[i];
            } else if (name.indexOf(meta.extra) !== -1 &&
                (best.name || '').indexOf(meta.extra) === -1) {
                best = assets[i];
            }
        }
        return best;
    }

    // --- Render ------------------------------------------------------
    function buildDownloadButton(release) {
        if (!release) {
            // Sem release mais nova: apenas o botão de re-verificar.
            addGhost();
            return;
        }

        var currentOS = detectPlatform();
        // Um botão por sistema operacional.
        var perOS = {};
        var available = [];
        for (var p = 0; p < PLATFORMS.length; p++) {
            var meta = PLATFORMS[p];
            var asset = pickAsset(release.assets, meta.key);
            if (asset) {
                perOS[meta.key] = asset;
                available.push(meta);
            }
        }

        if (!available.length) {
            // Release sem nenhum asset de instalador: cai para a página da release.
            var fallback = document.createElement('a');
            fallback.className = 'btn btn--primary';
            fallback.textContent = 'Baixar nova versão';
            fallback.href = release.html_url;
            fallback.target = '_blank';
            fallback.rel = 'noopener';
            el.actions.appendChild(fallback);
        } else {
            for (var i = 0; i < available.length; i++) {
                var m = available[i];
                var a = document.createElement('a');
                a.className = 'btn ' + (m.key === currentOS ? 'btn--primary' : 'btn--ghost');
                a.textContent = 'Baixar para ' + m.label;
                a.href = perOS[m.key].browser_download_url || release.html_url;
                a.title = perOS[m.key].name;
                a.target = '_blank';
                a.rel = 'noopener';
                el.actions.appendChild(a);
            }
        }

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
        el.notes.textContent = String(release.body || '').replace(IGNORE_NOTE_LINE, '').trim();
        setBadge('Nova versão disponível', 'new');
        buildDownloadButton(release);
        el.hint.textContent = 'Baixe e instale a nova versão para continuar usando o app.';
    }

    function stateSameVersion(release) {
        el.latest.textContent = release.tag_name;
        el.notes.textContent = String(release.body || '').replace(IGNORE_NOTE_LINE, '').trim();
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
                if (res.status === 404) {
                    // Repositório existe, mas ainda não há release publicada.
                    setBadge('Nenhuma versão publicada ainda', 'ok');
                    buildDownloadButton(null);
                    el.hint.textContent = 'Assim que uma release for criada, o botão de download aparecerá aqui.';
                    return;
                }
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (release) {
                if (!release) return; // já tratado em 404
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