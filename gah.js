/*

  Usage:

    gah.authenticate(oathClientId)

    gah.on('authenticated', function () {
      var client1 = gah.newClient(analyticsViewId1, targetPath1)
      client1.on('checked', function (e) {
        alert('Count check 1: ' + e.detail.count)
      })

      var client2 = gah.newClient(analyticsViewId2, targetPath2)
      client2.on('checked', function (e) {
        alert('Count check 2: ' + e.detail.count)
      })

      client1.check()
      client2.check()
    })

*/
window.gah = (function () {
  'use strict'

  var _authenticated = false
  var _eventTarget = document.createElement('div')

  var _hideAuthButton = function () {
    var button = document.getElementById('auth-button')
    if (button !== null) {
      button.outerHTML = ''
    }
  }

  var authenticate = function (clientId) {
    window.gapi.analytics.ready(function () {
      window.gapi.analytics.auth.authorize({
        container: 'auth-button',
        clientid: clientId
      })
      window.gapi.analytics.auth.on('success', function (response) {
        _hideAuthButton()
        _authenticated = true
        _eventTarget.dispatchEvent(new window.Event('authenticated'))
      })
    })
  }

  var newClient = function (viewId, target) {
    var _eventTarget = document.createElement('div')
    var check = function () {
      if (_authenticated !== true) {
        console.log('ERROR: Must call setup() before check()')
        return
      }
      new window.gapi.analytics.report.Data({
        'query': {
          'ids': 'ga:' + viewId,
          'metrics': 'ga:uniquePageViews',
          'dimensions': 'ga:pagePath,ga:day',
          'filters': 'ga:pagePath==' + target,
          'start-date': '0daysAgo',
          'end-date': '0daysAgo',
          'samplingLevel': 'HIGHER_PRECISION'
        }
      }).on('success', function (response) {
        var count = 0
        if (response.totalResults > 0) {
          count = parseInt(response.rows[0][2], 10)
        }
        var payload = {'detail': {'count': count}}
        _eventTarget.dispatchEvent(new window.CustomEvent('checked', payload))
      }).execute()
    }

    var on = function (evt, handler) {
      if (evt === 'checked') {
        _eventTarget.addEventListener(evt, function (e) {
          handler(e)
        }, false)
        return
      }
      console.log('ERROR: Unknown event "' + evt + '", must be "checked"')
    }

    var client = (function () {
      return {
        on: on,
        check: check
      }
    }())

    return client
  }

  var on = function (evt, handler) {
    if (evt === 'authenticated') {
      _eventTarget.addEventListener(evt, function (e) {
        handler(e)
      }, false)
      return
    }
    console.log('ERROR: Unknown event "' + evt + '", must be "authenticated"')
  }

  return {
    on: on,
    authenticate: authenticate,
    newClient: newClient
  }
}())
