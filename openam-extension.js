(function(ext) {
  var authObject = null,
      ssoTokenId = null,
      userDetails = null,
      inputNeeded = false,
      complete = false,
      authenticateResponse = function(response) {
        if (response.tokenId) {
          ssoTokenId = response.tokenId;
          complete = true;
        } else {
          authObject = response;
          inputNeeded = true;
        }
      };

  // Cleanup function when the extension is unloaded
  ext._shutdown = function() {};

  // Status reporting code
  // Use this to report missing hardware, plugin or unsupported browser
  ext._getStatus = function() {
    return {status: 2, msg: 'Ready'};
  };

  ext.startAuth = function(amUrl) {
    baseAmUrl = amUrl;
    authObject = {};
    ext.authenticate();
  };

  ext.authenticate = function() {
    // Make an AJAX call to the OpenAM authenticate endpoint
    $.ajax({
      url: baseAmUrl + '/json/authenticate',
      dataType: 'json',
      type: 'POST',
      data: JSON.stringify(authObject),
      contentType: 'application/json',
      success: authenticateResponse
    });
  };

  ext.inputNeeded = function() {
    if (inputNeeded === true) {
      inputNeeded = false;
      return true;
    }
    return false;
  };

  ext.getNumberInputs = function() {
    return authObject.callbacks.length;
  };

  ext.getInput = function(i) {
    return 'Please enter your ' + authObject.callbacks[i].output[0].value;
  };

  ext.setInput = function(i, value) {
    authObject.callbacks[i].input[0].value = value;
  };

  ext.complete = function() {
    if (complete === true) {
      complete = false;
      return true;
    }
    return false;
  };

  ext.getDetails = function(attribute, callback) {
    if (userDetails) {
      callback(userDetails[attribute]);
      return;
    }
    $.ajax({
      url: baseAmUrl + '/json/users?_action=idFromSession',
      headers: { iPlanetDirectoryPro: ssoTokenId },
      data: '{}',
      dataType: 'json',
      type: 'POST',
      contentType: 'application/json'
    }).then(null, function(result) {
      return $.ajax({
        url: baseAmUrl + '/json/users/' + result.id,
        headers: { iPlanetDirectoryPro: ssoTokenId },
        dataType: 'json',
        type: 'GET'
      })
    }).done(function(result) {
      userDetails = result;
      callback(userDetails[attribute]);
    });
  };

  // Block and block menu descriptions
  var descriptor = {
    blocks: [
      ['', 'start authentication from %s', 'startAuth', 'http://local.example.com:8080/openam'],
      ['h', 'authentication input needed', 'inputNeeded'],
      ['r', 'get authentication input count', 'getNumberInputs'],
      ['r', 'get authentication input %n', 'getInput', ''],
      ['', 'set authentication input %n to %s', 'setInput', '', ''],
      ['', 'send authentication details', 'authenticate'],
      ['h', 'authentication complete', 'complete'],
      ['R', 'get user detail called %s', 'getDetails', 'cn']
    ]
  };

  // Register the extension
  ScratchExtensions.register('OpenAM Extension', descriptor, ext);
})({});
