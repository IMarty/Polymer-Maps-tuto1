
  'use strict'

  Polymer({
    is: 'iron-request',

    properties: {

      /**
       * A reference to the XMLHttpRequest instance used to generate the
       * network request.
       *
       * @attribute xhr
       * @type XMLHttpRequest
       * @default `new XMLHttpRequest`
       */
      xhr: {
        type: Object,
        notify: true,
        readOnly: true,
        value: function() {
          return new XMLHttpRequest();
        }
      },

      /**
       * A reference to the parsed response body, if the `xhr` has completely
       * resolved.
       *
       * @attribute response
       * @type {*}
       * @default null
       */
      response: {
        type: Object,
        notify: true,
        readOnly: true,
        value: function() {
         return null;
        }
      },

      /**
       * A reference to the status code, if the `xhr` has completely resolved.
       *
       * @attribute status
       * @type short
       * @default 0
       */
      status: {
        type: Number,
        notify: true,
        readOnly: true,
        value: 0
      },

      /**
       * A reference to the status text, if the `xhr` has completely resolved.
       *
       * @attribute statusText
       * @type String
       * @default ""
       */
      statusText: {
        type: String,
        notify: true,
        readOnly: true,
        value: ''
      },

      /**
       * A promise that resolves when the `xhr` response comes back, or rejects
       * if there is an error before the `xhr` completes.
       *
       * @attribute completes
       * @type Promise
       * @default `new Promise`
       */
      completes: {
        type: Object,
        readOnly: true,
        notify: true,
        value: function() {
          return new Promise(function (resolve, reject) {
            this.resolveCompletes = resolve;
            this.rejectCompletes = reject;
          }.bind(this));
        }
      },

      /**
       * An object that contains progress information emitted by the XHR if
       * available.
       *
       * @attribute progress
       * @type Object
       * @default {}
       */
      progress: {
        type: Object,
        notify: true,
        readOnly: true,
        value: function() {
          return {};
        }
      },

      /**
       * Aborted will be true if an abort of the request is attempted.
       *
       * @attribute aborted
       * @type boolean
       * @default false
       */
      aborted: {
        type: Boolean,
        notify: true,
        readOnly: true,
        value: false,
      }
    },

    /**
     * Succeeded is true if the request succeeded. The request succeeded if the
     * status code is greater-than-or-equal-to 200, and less-than 300. Also,
     * the status code 0 is accepted as a success even though the outcome may
     * be ambiguous.
     *
     * @return {boolean}
     */
    get succeeded() {
      var status = this.xhr.status || 0;

      // Note: if we are using the file:// protocol, the status code will be 0
      // for all outcomes (successful or otherwise).
      return status === 0 ||
        (status >= 200 && status < 300);
    },

    /**
     * Sends an HTTP request to the server and returns the XHR object.
     *
     * @param {{
     *   url: string,
     *   method: (string|undefined),
     *   async: (boolean|undefined),
     *   body: (ArrayBuffer|ArrayBufferView|Blob|Document|FormData|null|string|undefined|Object),
     *   headers: (Object|undefined),
     *   handleAs: (string|undefined),
     *   withCredentials: (boolean|undefined)}} options -
     *     url The url to which the request is sent.
     *     method The HTTP method to use, default is GET.
     *     async By default, all requests are sent asynchronously. To send synchronous requests,
     *         set to true.
     *     body The content for the request body for POST method.
     *     headers HTTP request headers.
     *     handleAs The response type. Default is 'text'.
     *     withCredentials Whether or not to send credentials on the request. Default is false.
     * @return {Promise}
     */
    send: function (options) {
      var xhr = this.xhr;

      if (xhr.readyState > 0) {
        return null;
      }

      xhr.addEventListener('readystatechange', function () {
        if (xhr.readyState === 4 && !this.aborted) {
          this._updateStatus();

          if (!this.succeeded) {
            this.rejectCompletes(new Error('The request failed with status code: ' + this.xhr.status));
            return;
          }

          this._setResponse(this.parseResponse());
          this.resolveCompletes(this);
        }
      }.bind(this));

      xhr.addEventListener('progress', function (progress) {
        this._setProgress({
          lengthComputable: progress.lengthComputable,
          loaded: progress.loaded,
          total: progress.total
        });
      }.bind(this))

      xhr.addEventListener('error', function (error) {
        this._updateStatus();
        this.rejectCompletes(error);
      }.bind(this));

      xhr.addEventListener('abort', function () {
        this._updateStatus();
        this.rejectCompletes(new Error('Request aborted.'));
      }.bind(this));

      xhr.open(
        options.method || 'GET',
        options.url,
        options.async !== false
      );

      if (options.headers) {
        Object.keys(options.headers).forEach(function (requestHeader) {
          xhr.setRequestHeader(
            requestHeader,
            options.headers[requestHeader]
          );
        }, this);
      }

      var contentType;
      if (options.headers) {
        contentType = options.headers['Content-Type'];
      }
      var body = this._encodeBodyObject(options.body, contentType);


      // In IE, `xhr.responseType` is an empty string when the response
      // returns. Hence, caching it as `xhr._responseType`.
      xhr.responseType = xhr._responseType = (options.handleAs || 'text');
      xhr.withCredentials = !!options.withCredentials;



      xhr.send(body);

      return this.completes;
    },

    /**
     * Attempts to parse the response body of the XHR. If parsing succeeds,
     * the value returned will be deserialized based on the `responseType`
     * set on the XHR.
     *
     * @return {*} The parsed response,
     * or undefined if there was an empty response or parsing failed.
     */
    parseResponse: function () {
      var xhr = this.xhr;
      var responseType = this.xhr.responseType ||
        this.xhr._responseType;
      // If we don't have a natural `xhr.responseType`, we prefer parsing
      // `xhr.responseText` over returning `xhr.response`..
      var preferResponseText = !this.xhr.responseType;

      try {
        switch (responseType) {
          case 'json':
            // If xhr.response is undefined, responseType `json` may
            // not be supported.
            if (preferResponseText || xhr.response === undefined) {
              // If accessing `xhr.responseText` throws, responseType `json`
              // is supported and the result is rightly `undefined`.
              try {
                xhr.responseText;
              } catch (e) {
                return xhr.response;
              }

              // Otherwise, attempt to parse `xhr.responseText` as JSON.
              if (xhr.responseText) {
                return JSON.parse(xhr.responseText);
              }
            }

            return xhr.response;
          case 'xml':
            return xhr.responseXML;
          case 'blob':
          case 'document':
          case 'arraybuffer':
            return xhr.response;
          case 'text':
          default:
            return xhr.responseText;
        }
      } catch (e) {
        this.rejectCompletes(new Error('Could not parse response. ' + e.message));
      }
    },

    /**
     * Aborts the request.
     */
    abort: function () {
      this._setAborted(true);
      this.xhr.abort();
    },

    /**
     * @param {*} body The given body of the request to try and encode.
     * @param {?string} contentType The given content type, to infer an encoding
     *     from.
     * @return {?string|*} Either the encoded body as a string, if successful,
     *     or the unaltered body object if no encoding could be inferred.
     */
    _encodeBodyObject: function(body, contentType) {
      if (typeof body == 'string') {
        return body;  // Already encoded.
      }
      switch(contentType) {
        case('application/json'):
          return JSON.stringify(body);
        case('application/x-www-form-urlencoded'):
          return this._wwwFormUrlEncode(body);
      }
      return body;  // Unknown, make no change.
    },

    /**
     * @param {Object} object The object to encode as x-www-form-urlencoded.
     * @return {string} .
     */
    _wwwFormUrlEncode: function(object) {
      if (!object) {
        return '';
      }
      var pieces = [];
      Object.keys(object).forEach(function(key) {
        // TODO(rictic): handle array values here, in a consistent way with
        //   iron-ajax params.
        pieces.push(
            this._wwwFormUrlEncodePiece(key) + '=' +
            this._wwwFormUrlEncodePiece(object[key]));
      }, this);
      return pieces.join('&');
    },

    /**
     * @param {*} str A key or value to encode as x-www-form-urlencoded.
     * @return {string} .
     */
    _wwwFormUrlEncodePiece: function(str) {
      // Spec says to normalize newlines to \r\n and replace %20 spaces with +.
      // jQuery does this as well, so this is likely to be widely compatible.
      return encodeURIComponent(str.toString().replace(/\r?\n/g, '\r\n'))
          .replace(/%20/g, '+');
    },

    /**
     * Updates the status code and status text.
     */
    _updateStatus: function() {
      this._setStatus(this.xhr.status);
      this._setStatusText((this.xhr.statusText === undefined) ? '' : this.xhr.statusText);
    }
  });