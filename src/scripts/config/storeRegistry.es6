/*!
 *
 * The Store Registry is used to keep organized in one place all the AJAX
 * requests our app could make.
 * Each entry in the registry could be a single call, or a combination of
 * multiple chainable calls.
 *
 * TODO:
 *  - Data aggregation in combo entries. (to be supported by store.es6)
 *
 *
 * ENTRY OPTIONS:
 *   url: a fully qualified uri
 *   headers: http headers (default: {})
 *   data: JSON object descriptive of the data to be sent
 *   type: a string enum. html, xml, json, or jsonp
 *   contentType: sets the Content-Type of the request. Eg: application/json
 *   crossOrigin: for cross-origin requests for browsers that support it
 *   jsonpCallback: Specify the callback function name for a JSONP request
 *   nocache: boolean, every request will be made anew
 *   real: (development environment only) boolean, it instructs the Store class
 *         to temporarily disable the mock server for that specific request
 *
 * COMBO RELATED OPTIONS:
 *   id: identifier of a previously defined registry entry
 *   map: object used to define mapping relation between the current entry data
 *     and the previous one.
 *
 * COMBO EXAMPLE:
 *   'combo': [{
 *     'url': '/api/first',
 *   }, {
 *     'url': '/api/second',
 *     'data': {
 *       'default': 'stuff'
 *     },
 *     'map': {
 *       'deeply.nested.key': 'extra'
 *     }
 *   }]
 *
 *   assuming that a call to '/api/first' produces a json like:
 *   {
 *     deeply: {
 *       nested: {
 *         key: 'extraInfo'
 *       }
 *     }
 *   }
 *
 *   the value of the json.deeply.nested.key will be passed to the key
 *   'extra' of the data object for the call to '/api/second'.
 *
 */

var base = '/log-center';

export default {

  'users': {
    'url': `${base}/users`
  },
  'user-apps': {
    'url': `${base}/:user/apps`
  }

};
