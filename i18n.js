(function () {
    var SUPPORTED_LANGUAGES = [
        'en', 'zh-Hans', 'zh-Hant', 'ja', 'ko',
        'fr', 'de', 'it', 'es-ES', 'es-419', 'pt-BR'
    ];
    var DEFAULT_LANGUAGE = 'en';

    // Map common browser locale codes to our supported language codes
    var LOCALE_MAP = {
        'zh-CN': 'zh-Hans',
        'zh-SG': 'zh-Hans',
        'zh-TW': 'zh-Hant',
        'zh-HK': 'zh-Hant',
        'zh-MO': 'zh-Hant',
        'zh': 'zh-Hans',
        'es': 'es-ES',
        'pt': 'pt-BR'
    };

    function detectLanguage() {
        // 1. URL parameter
        var urlParams = new URLSearchParams(window.location.search);
        var urlLang = urlParams.get('lang');
        if (urlLang && SUPPORTED_LANGUAGES.indexOf(urlLang) !== -1) return urlLang;

        // 2. localStorage
        var storedLang = localStorage.getItem('lang');
        if (storedLang && SUPPORTED_LANGUAGES.indexOf(storedLang) !== -1) return storedLang;

        // 3. Browser locale
        var browserLangs = navigator.languages || [navigator.language || navigator.userLanguage];
        for (var i = 0; i < browserLangs.length; i++) {
            var bl = browserLangs[i];
            // Exact match
            if (SUPPORTED_LANGUAGES.indexOf(bl) !== -1) return bl;
            // Mapped match
            if (LOCALE_MAP[bl]) return LOCALE_MAP[bl];
            // Base language match (e.g. "fr-CA" → "fr")
            var base = bl.split('-')[0];
            if (LOCALE_MAP[base]) return LOCALE_MAP[base];
            if (SUPPORTED_LANGUAGES.indexOf(base) !== -1) return base;
        }

        return DEFAULT_LANGUAGE;
    }

    function applyTranslations(translations) {
        // Page title
        if (translations.page_title) {
            document.title = translations.page_title;
        }

        // Plain text nodes
        var textEls = document.querySelectorAll('[data-i18n]');
        for (var i = 0; i < textEls.length; i++) {
            var key = textEls[i].getAttribute('data-i18n');
            if (translations[key] != null) {
                textEls[i].textContent = translations[key];
            }
        }

        // HTML content nodes
        var htmlEls = document.querySelectorAll('[data-i18n-html]');
        for (var j = 0; j < htmlEls.length; j++) {
            var hkey = htmlEls[j].getAttribute('data-i18n-html');
            if (translations[hkey] != null) {
                htmlEls[j].innerHTML = translations[hkey];
            }
        }
    }

    function setLanguage(lang) {
        fetch('locales/' + lang + '.json')
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (translations) {
                applyTranslations(translations);
                document.documentElement.lang = lang === 'zh-Hans' ? 'zh-CN'
                    : lang === 'zh-Hant' ? 'zh-TW'
                    : lang;
                localStorage.setItem('lang', lang);

                // Update URL
                var url = new URL(window.location);
                if (lang === DEFAULT_LANGUAGE) {
                    url.searchParams.delete('lang');
                } else {
                    url.searchParams.set('lang', lang);
                }
                history.replaceState(null, '', url);

                // Sync selector
                var select = document.getElementById('language-select');
                if (select) select.value = lang;
            })
            .catch(function (err) {
                console.error('i18n: failed to load ' + lang, err);
            });
    }

    // Initialize on DOM ready
    var lang = detectLanguage();
    var select = document.getElementById('language-select');
    if (select) {
        select.value = lang;
        select.addEventListener('change', function (e) {
            setLanguage(e.target.value);
        });
    }

    if (lang !== DEFAULT_LANGUAGE) {
        setLanguage(lang);
    } else {
        // Still store the preference and sync URL
        localStorage.setItem('lang', lang);
        var url = new URL(window.location);
        if (url.searchParams.has('lang')) {
            url.searchParams.delete('lang');
            history.replaceState(null, '', url);
        }
    }
})();
