

  'use strict';

  Polymer({

    is: 'marked-element',

    properties: {

      /** The markdown source that should be rendered by this element. */
      markdown: {
        observer: 'render',
        type: String,
        value: null
      }

    },

    ready: function() {
      if (!this.markdown) {
        // Use the Markdown from the first `<script>` descendant whose MIME type starts with
        // "text/markdown". Script elements beyond the first are ignored.
        var markdownElement = Polymer.dom(this).querySelector('[type^="text/markdown"]');
        if (markdownElement != null) {
          this.markdown = this._unindent(markdownElement.textContent);
        }
      }
    },

    /**
     * Renders `markdown` to HTML when the element is attached.
     *
     * This serves a dual purpose:
     *
     *  * Prevents unnecessary work (no need to render when not visible).
     *
     *  * `attached` fires top-down, so we can give ancestors a chance to
     *    register listeners for the `syntax-highlight` event _before_ we render
     *    any markdown.
     *
     */
    attached: function() {
      this._attached = true;
      this.render();
    },

    detached: function() {
      this._attached = false;
    },

    /**
     * Renders `markdown` into this element's DOM.
     *
     * This is automatically called whenever the `markdown` property is changed.
     *
     * The only case where you should be calling this is if you are providing
     * markdown via `<script type="text/markdown">` after this element has been
     * constructed (or updating that markdown).
     */
    render: function() {
      if (!this._attached) return;
      if (!this.markdown) {
        this.$.content.innerHTML = '';
        return;
      }

      this.$.content.innerHTML = marked(this.markdown, {
        highlight: this._highlight.bind(this),
      });
    },

    _highlight: function(code, lang) {
      var event = this.fire('syntax-highlight', {code: code, lang: lang});
      return event.detail.code || code;
    },

    _unindent: function(text) {
      if (!text) return text;
      var lines  = text.replace(/\t/g, '  ').split('\n');
      var indent = lines.reduce(function(prev, line) {
        if (/^\s*$/.test(line)) return prev;  // Completely ignore blank lines.

        var lineIndent = line.match(/^(\s*)/)[0].length;
        if (prev === null) return lineIndent;
        return lineIndent < prev ? lineIndent : prev;
      }, null);

      return lines.map(function(l) { return l.substr(indent); }).join('\n');
    },

  });

