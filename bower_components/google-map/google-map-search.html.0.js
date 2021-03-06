
/**
Provides Google Maps Places API functionality.

See https://developers.google.com/maps/documentation/javascript/places for more
information on the API.

#### Example:

    <template is="dom-bind">
      <google-map-search map="{{map}}" query="Pizza"
                         result="{{result}}"></google-map-search>
      <google-map map="{{map}}" latitude="37.779"
                  longitude="-122.3892"></google-map>
      <div>Result:
        <span>{{result.latitude}}</span>,
        <span>{{result.longitude}}</span>
      </div>
    </template>
    <script>
      document.querySelector('google-map-search').search();
    < /script>

*/
  Polymer({

    is: 'google-map-search',

/**
Fired when the search element returns a result.

@event google-map-search-result
@param {Object} detail
  @param {number} detail.latitude Latitude of the result.
  @param {number} detail.longitude Longitude of the result.
  @param {bool} detail.show Whether to show the result on the map.
*/
    properties: {
      /**
       * The Google map object.
       */
      map: {
        type: Object,
        value: null
      },
      /**
       * The search query.
       */
      query: {
        type: String,
        value: null
      },

      /**
       * The search result.
       */
      result: {
        type: Object,
        value: null,
        notify: true
      }
    },

    observers: [
      'search(query,map)'
    ],

    /**
     * Performance a search using for `query` for the search term.
     */
    search: function() {
      if (this.query && this.map) {
        var places = new google.maps.places.PlacesService(this.map);
        places.textSearch({query: this.query}, this._gotResults.bind(this));
      }
    },

    _gotResults: function(results, status) {
      this.result = {
        latitude: results[0].geometry.location.lat(),
        longitude: results[0].geometry.location.lng(),
        show: true
      }
      this.fire('google-map-search-result', this.result);
    }
  });
