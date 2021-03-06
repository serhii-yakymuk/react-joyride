'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var ReactDOM = _interopDefault(require('react-dom'));
var ExecutionEnvironment = _interopDefault(require('exenv'));
var is = _interopDefault(require('is-lite'));
var scroll = _interopDefault(require('scroll'));
var scrollDoc = _interopDefault(require('scroll-doc'));
var getScrollParent = _interopDefault(require('scrollparent'));
var deepmerge = _interopDefault(require('deepmerge'));
var React = _interopDefault(require('react'));
var PropTypes = _interopDefault(require('prop-types'));
var isRequiredIf = _interopDefault(require('react-proptype-conditional-require'));
var Floater = _interopDefault(require('react-floater'));

var STATUS = {
  IDLE: 'idle',
  READY: 'ready',
  WAITING: 'waiting',
  RUNNING: 'running',
  PAUSED: 'paused',
  SKIPPED: 'skipped',
  FINISHED: 'finished',
  ERROR: 'error'
};

var ACTIONS = {
  INIT: 'init',
  START: 'start',
  STOP: 'stop',
  RESET: 'reset',
  RESTART: 'restart',
  PREV: 'prev',
  NEXT: 'next',
  GO: 'go',
  INDEX: 'index',
  CLOSE: 'close',
  SKIP: 'skip',
  UPDATE: 'update'
};

var LIFECYCLE = {
  INIT: 'init',
  READY: 'ready',
  BEACON: 'beacon',
  TOOLTIP: 'tooltip',
  COMPLETE: 'complete',
  ERROR: 'error'
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var objectWithoutProperties = function (obj, keys) {
  var target = {};

  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }

  return target;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var canUseDOM = ExecutionEnvironment.canUseDOM;

var isReact16 = ReactDOM.createPortal !== undefined;

/**
 * Convert hex to RGB
 *
 * @param {string} hex
 * @returns {Array}
 */
function hexToRGB(hex) {
  // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  var properHex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(properHex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
}

/**
 * Get the current browser
 *
 * @returns {String}
 */
function getBrowser() {
  /* istanbul ignore if */
  if (typeof window === 'undefined') {
    return 'node';
  }

  // Opera 8.0+
  if (Boolean(window.opera) || navigator.userAgent.indexOf(' OPR/') >= 0) {
    return 'opera';
  }
  // Firefox 1.0+
  if (typeof window.InstallTrigger !== 'undefined') {
    return 'firefox';
  }
  // Chrome 1+
  if (!!window.chrome && !!window.chrome.webstore) {
    return 'chrome';
  }

  if (/Version\/([0-9._]+).*Safari/.test(navigator.userAgent)) {
    return 'safari';
  }

  if (document.documentMode) {
    return 'ie';
  }

  return navigator.userAgent;
}

/**
 * Detect legacy browsers
 *
 * @returns {boolean}
 */
function isLegacy() {
  return !(['chrome', 'safari', 'firefox', 'opera'].indexOf(getBrowser()) !== -1);
}

/**
 * Log method calls if debug is enabled
 *
 * @private
 * @param {Object}       arg
 * @param {string}       arg.title    - The title the logger was called from
 * @param {Object|Array} [arg.data]   - The data to be logged
 * @param {boolean}      [arg.warn]  - If true, the message will be a warning
 * @param {boolean}      [arg.debug] - Nothing will be logged unless debug is true
 */
function log(_ref) {
  var title = _ref.title,
      data = _ref.data,
      _ref$warn = _ref.warn,
      warn = _ref$warn === undefined ? false : _ref$warn,
      _ref$debug = _ref.debug,
      debug = _ref$debug === undefined ? false : _ref$debug;

  /* eslint-disable no-console */
  var logFn = warn ? console.warn || console.error : console.log;

  if (debug && title && data) {
    console.groupCollapsed('%creact-joyride: ' + title, 'color: #ff0044; font-weight: bold; font-size: 12px;');

    if (Array.isArray(data)) {
      data.forEach(function (d) {
        if (is.plainObject(d) && d.key) {
          logFn.apply(console, [d.key, d.value]);
        } else {
          logFn.apply(console, [d]);
        }
      });
    } else {
      logFn.apply(console, [data]);
    }

    console.groupEnd();
  }
  /* eslint-enable */
}

function hasValidKeys(value, keys) {
  if (!is.plainObject(value) || !is.array(keys)) {
    return false;
  }
  var validKeys = keys;

  if (is.string(keys)) {
    validKeys = [keys];
  }

  return Object.keys(value).every(function (d) {
    return validKeys.indexOf(d) !== -1;
  });
}

function isEqual(a, b) {
  var p = void 0;
  var t = void 0;

  for (p in a) {
    if (Object.prototype.hasOwnProperty.call(a, p)) {
      if (typeof b[p] === 'undefined') {
        return false;
      }

      if (b[p] && !a[p]) {
        return false;
      }

      t = _typeof(a[p]);

      if (t === 'object' && !isEqual(a[p], b[p])) {
        return false;
      }

      if (t === 'function' && (typeof b[p] === 'undefined' || a[p].toString() !== b[p].toString())) {
        return false;
      }

      if (a[p] !== b[p]) {
        return false;
      }
    }
  }

  for (p in b) {
    if (typeof a[p] === 'undefined') {
      return false;
    }
  }

  return true;
}

var defaultState = {
  action: '',
  controlled: false,
  index: 0,
  lifecycle: LIFECYCLE.INIT,
  size: 0,
  status: STATUS.IDLE
};

var validKeys = ['action', 'index', 'lifecycle', 'status'];

function createStore(props) {
  var store = new Map();
  var data = new Map();

  var Store = function () {
    function Store() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          _ref$continuous = _ref.continuous,
          continuous = _ref$continuous === undefined ? false : _ref$continuous,
          stepIndex = _ref.stepIndex,
          _ref$steps = _ref.steps,
          steps = _ref$steps === undefined ? [] : _ref$steps;

      classCallCheck(this, Store);

      _initialiseProps.call(this);

      this.setState({
        action: ACTIONS.INIT,
        controlled: is.number(stepIndex),
        continuous: continuous,
        index: is.number(stepIndex) ? stepIndex : 0,
        lifecycle: LIFECYCLE.INIT,
        status: steps.length ? STATUS.READY : STATUS.IDLE
      }, true);

      this.setSteps(steps);
    }

    createClass(Store, [{
      key: 'addListener',
      value: function addListener(listener) {
        this.listener = listener;
      }
    }, {
      key: 'setState',
      value: function setState(nextState) {
        var initial = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        var state = this.getState();

        var _state$nextState = _extends({}, state, nextState),
            action = _state$nextState.action,
            index = _state$nextState.index,
            lifecycle = _state$nextState.lifecycle,
            status = _state$nextState.status;

        store.set('action', action);
        store.set('index', index);
        store.set('lifecycle', lifecycle);
        store.set('status', status);

        if (initial) {
          store.set('controlled', nextState.controlled);
          store.set('continuous', nextState.continuous);
        }

        /* istanbul ignore else */
        if (this.listener && this.hasUpdatedState(state)) {
          // console.log('▶ ▶ ▶ NEW STATE', this.getState());
          this.listener(this.getState());
        }
      }
    }, {
      key: 'getState',
      value: function getState() {
        if (!store.size) {
          return _extends({}, defaultState);
        }

        var index = parseInt(store.get('index'), 10);
        var steps = this.getSteps();
        var size = steps.length;

        return {
          action: store.get('action'),
          controlled: store.get('controlled'),
          index: index,
          lifecycle: store.get('lifecycle'),
          size: size,
          status: store.get('status')
        };
      }
    }, {
      key: 'getNextState',
      value: function getNextState(state) {
        var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        var _getState = this.getState(),
            action = _getState.action,
            controlled = _getState.controlled,
            index = _getState.index,
            size = _getState.size,
            status = _getState.status;

        var newIndex = is.number(state.index) ? state.index : index;
        var nextIndex = controlled && !force ? index : Math.min(Math.max(newIndex, 0), size);

        return {
          action: state.action || action,
          index: nextIndex,
          lifecycle: state.lifecycle || LIFECYCLE.INIT,
          status: nextIndex === size ? STATUS.FINISHED : state.status || status
        };
      }
    }, {
      key: 'hasUpdatedState',
      value: function hasUpdatedState(oldState) {
        var before = JSON.stringify(oldState);
        var after = JSON.stringify(this.getState());

        return before !== after;
      }
    }, {
      key: 'getSteps',
      value: function getSteps() {
        var steps = data.get('steps');

        return Array.isArray(steps) ? steps : [];
      }
    }, {
      key: 'getHelpers',
      value: function getHelpers() {
        return {
          start: this.start,
          stop: this.stop,
          restart: this.restart,
          reset: this.reset,
          prev: this.prev,
          next: this.next,
          go: this.go,
          index: this.index,
          close: this.close,
          skip: this.skip,
          info: this.info
        };
      }
    }]);
    return Store;
  }();

  var _initialiseProps = function _initialiseProps() {
    var _this = this;

    this.setSteps = function (steps) {
      var _getState2 = _this.getState(),
          size = _getState2.size,
          status = _getState2.status;

      data.set('steps', steps);

      if (status === STATUS.WAITING && !size && steps.length) {
        _this.setState({ status: STATUS.RUNNING });
      }
    };

    this.update = function (state) {
      if (!hasValidKeys(state, validKeys)) {
        throw new Error('state is not valid');
      }

      _this.setState(_extends({}, _this.getNextState(_extends({}, _this.getState(), state, {
        action: state.action || ACTIONS.UPDATE
      }), true)));
    };

    this.steps = function (nextSteps) {
      if (!is.array(nextSteps)) return;

      _this.setSteps(nextSteps);
    };

    this.start = function (nextIndex) {
      var _getState3 = _this.getState(),
          index = _getState3.index,
          size = _getState3.size;

      _this.setState(_extends({}, _this.getNextState({
        action: ACTIONS.START,
        index: is.number(nextIndex) ? nextIndex : index
      }), {
        status: size ? STATUS.RUNNING : STATUS.WAITING
      }));
    };

    this.stop = function () {
      var advance = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      var _getState4 = _this.getState(),
          index = _getState4.index,
          status = _getState4.status;

      if ([STATUS.FINISHED, STATUS.SKIPPED].indexOf(status) !== -1) return;

      _this.setState(_extends({}, _this.getNextState({ action: ACTIONS.STOP, index: index + (advance ? 1 : 0) }), {
        status: STATUS.PAUSED
      }));
    };

    this.restart = function () {
      var _getState5 = _this.getState(),
          controlled = _getState5.controlled;

      if (controlled) return;

      _this.setState(_extends({}, _this.getNextState({ action: ACTIONS.RESTART, index: 0 }), {
        status: STATUS.RUNNING
      }));
    };

    this.reset = function () {
      var _getState6 = _this.getState(),
          controlled = _getState6.controlled;

      if (controlled) return;

      _this.setState(_extends({}, _this.getNextState({ action: ACTIONS.RESET, index: 0 }), {
        status: STATUS.READY
      }));
    };

    this.prev = function () {
      var _getState7 = _this.getState(),
          index = _getState7.index,
          status = _getState7.status;

      if (status !== STATUS.RUNNING) return;

      _this.setState(_extends({}, _this.getNextState({ action: ACTIONS.PREV, index: index - 1 })));
    };

    this.next = function () {
      var _getState8 = _this.getState(),
          index = _getState8.index,
          status = _getState8.status;

      if (status !== STATUS.RUNNING) return;

      _this.setState(_this.getNextState({ action: ACTIONS.NEXT, index: index + 1 }));
    };

    this.go = function (number) {
      var _getState9 = _this.getState(),
          index = _getState9.index,
          status = _getState9.status;

      if (status !== STATUS.RUNNING) return;

      _this.setState(_extends({}, _this.getNextState({ action: ACTIONS.GO, index: index + number })));
    };

    this.index = function (nextIndex) {
      var _getState10 = _this.getState(),
          status = _getState10.status;

      if (status !== STATUS.RUNNING) return;

      var step = _this.getSteps()[nextIndex];

      _this.setState(_extends({}, _this.getNextState({ action: ACTIONS.INDEX, index: nextIndex }), {
        status: step ? status : STATUS.FINISHED
      }));
    };

    this.close = function () {
      var _getState11 = _this.getState(),
          index = _getState11.index,
          status = _getState11.status;

      if (status !== STATUS.RUNNING) return;

      _this.setState(_extends({}, _this.getNextState({ action: ACTIONS.CLOSE, index: index + 1 })));
    };

    this.skip = function () {
      var _getState12 = _this.getState(),
          status = _getState12.status;

      if (status !== STATUS.RUNNING) return;

      _this.setState({
        action: ACTIONS.SKIP,
        lifecycle: LIFECYCLE.INIT,
        status: STATUS.SKIPPED
      });
    };

    this.info = function () {
      return _this.getState();
    };
  };

  return new Store(props);
}

/**
 * Find the bounding client rect
 *
 * @private
 * @param {HTMLElement} element - The target element
 * @returns {Object}
 */
function getClientRect(element) {
  if (!element) {
    return {};
  }

  return element.getBoundingClientRect();
}

/**
 * Helper function to get the browser-normalized "document height"
 * @returns {Number}
 */
function getDocumentHeight() {
  var _document = document,
      body = _document.body,
      html = _document.documentElement;


  if (!body || !html) {
    return 0;
  }

  return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
}

function getStyleComputedProperty(el) {
  if (!el || el.nodeType !== 1) {
    return {};
  }

  return getComputedStyle(el);
}

function hasCustomScrollParent(element) {
  if (!element) {
    return false;
  }
  return getScrollParent(element) !== scrollDoc();
}

function hasCustomOffsetParent(element) {
  return element.offsetParent !== document.body;
}

function isFixed(el) {
  if (!el || !(el instanceof HTMLElement)) {
    return false;
  }

  var nodeName = el.nodeName;


  if (nodeName === 'BODY' || nodeName === 'HTML') {
    return false;
  }

  if (getStyleComputedProperty(el).position === 'fixed') {
    return true;
  }

  return isFixed(el.parentNode);
}

/**
 * Get the scrollTop position
 *
 * @param {HTMLElement} element
 * @param {number} offset
 *
 * @returns {number}
 */
function getScrollTo(element, offset) {
  if (!element) {
    return 0;
  }

  var parent = getScrollParent(element);
  var top = element.offsetTop;

  if (hasCustomScrollParent(element) && !hasCustomOffsetParent(element)) {
    top -= parent.offsetTop;
  }

  return Math.floor(top - offset);
}

/**
 * Find and return the target DOM element based on a step's 'target'.
 *
 * @private
 * @param {string|HTMLElement} element
 *
 * @returns {HTMLElement|undefined}
 */
function getElement(element) {
  if (typeof element !== 'string') {
    return element;
  }

  return element ? document.querySelector(element) : null;
}

/**
 * Find and return the target DOM element based on a step's 'target'.
 *
 * @private
 * @param {string|HTMLElement} element
 * @param {number} offset
 *
 * @returns {HTMLElement|undefined}
 */
function getElementPosition(element, offset) {
  var elementRect = getClientRect(element);
  var scrollParent = getScrollParent(element);
  var hasScrollParent = hasCustomScrollParent(element);

  var top = elementRect.top + (!hasScrollParent && !isFixed(element) ? scrollParent.scrollTop : 0);

  return Math.floor(top - offset);
}

function scrollTo(value) {
  var element = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : scrollDoc();

  return new Promise(function (resolve, reject) {
    var scrollTop = element.scrollTop;


    var limit = value > scrollTop ? value - scrollTop : scrollTop - value;

    scroll.top(element, value, { duration: limit < 100 ? 50 : 300 }, function (error) {
      if (error && error.message !== 'Element already at target scroll position') {
        return reject(error);
      }

      return resolve();
    });
  });
}

var defaultOptions = {
  arrowColor: '#fff',
  backgroundColor: '#fff',
  primaryColor: '#f04',
  textColor: '#333',
  overlayColor: 'rgba(0, 0, 0, 0.5)',
  spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
  beaconSize: 36,
  zIndex: 100
};

var buttonReset = {
  backgroundColor: 'transparent',
  border: 0,
  borderRadius: 0,
  color: '#555',
  cursor: 'pointer',
  lineHeight: 1,
  outline: 'none',
  padding: 8,
  WebkitAppearance: 'none'
};

var spotlight = {
  borderRadius: 4,
  position: 'absolute'
};

function getStyles(stepStyles) {
  var options = deepmerge(defaultOptions, stepStyles.options || {});
  var width = 290;

  if (window.innerWidth > 480) {
    width = 380;
  } else if (window.innerWidth > 768) {
    width = 490;
  }

  var overlay = {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: options.zIndex
  };

  var defaultStyles = {
    beacon: _extends({}, buttonReset, {
      display: 'inline-block',
      height: options.beaconSize,
      position: 'relative',
      width: options.beaconSize,
      zIndex: options.zIndex
    }),
    beaconInner: {
      animation: 'joyride-beacon-inner 1.2s infinite ease-in-out',
      backgroundColor: options.primaryColor,
      borderRadius: '50%',
      display: 'block',
      height: '50%',
      left: '50%',
      opacity: 0.7,
      position: 'absolute',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: '50%'
    },
    beaconOuter: {
      animation: 'joyride-beacon-outer 1.2s infinite ease-in-out',
      backgroundColor: 'rgba(' + hexToRGB(options.primaryColor).join(',') + ', 0.2)',
      border: '2px solid ' + options.primaryColor,
      borderRadius: '50%',
      boxSizing: 'border-box',
      display: 'block',
      height: '100%',
      left: 0,
      opacity: 0.9,
      position: 'absolute',
      top: 0,
      transformOrigin: 'center',
      width: '100%'
    },
    tooltip: {
      backgroundColor: options.backgroundColor,
      borderRadius: 5,
      boxSizing: 'border-box',
      color: options.textColor,
      fontSize: 16,
      padding: 15,
      position: 'relative',
      width: width
    },
    tooltipContainer: {
      lineHeight: 1.4,
      textAlign: 'center'
    },
    tooltipTitle: {
      fontSize: 18,
      margin: '0 0 10px 0'
    },
    tooltipContent: {
      padding: '20px 10px'
    },
    tooltipFooter: {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 15
    },
    buttonNext: _extends({}, buttonReset, {
      backgroundColor: options.primaryColor,
      borderRadius: 4,
      color: '#fff'
    }),
    buttonBack: _extends({}, buttonReset, {
      color: options.primaryColor,
      marginLeft: 'auto',
      marginRight: 5
    }),
    buttonClose: _extends({}, buttonReset, {
      color: options.textColor,
      height: 14,
      padding: 15,
      position: 'absolute',
      right: 0,
      top: 0,
      width: 14
    }),
    buttonSkip: _extends({}, buttonReset, {
      color: options.textColor,
      fontSize: 14
    }),
    overlay: _extends({}, overlay, {
      backgroundColor: options.overlayColor,
      mixBlendMode: 'hard-light'
    }),
    overlayLegacy: _extends({}, overlay),
    spotlight: _extends({}, spotlight, {
      backgroundColor: 'gray'
    }),
    spotlightLegacy: _extends({}, spotlight, {
      boxShadow: '0 0 0 9999px ' + options.overlayColor + ', ' + options.spotlightShadow
    }),
    floater: {
      arrow: {
        color: options.arrowColor
      },
      floater: {
        zIndex: options.zIndex
      }
    }
  };

  return deepmerge(defaultStyles, stepStyles || {});
}

var DEFAULTS = {
  floaterProps: {
    options: {
      preventOverflow: {
        boundariesElement: 'scrollParent'
      }
    },
    wrapperOptions: {
      offset: -18,
      position: true
    }
  },
  locale: {
    back: 'Back',
    close: 'Close',
    last: 'Last',
    next: 'Next',
    skip: 'Skip'
  },
  step: {
    event: 'click',
    placement: 'bottom',
    offset: 10
  }
};

/**
 * Validate if a step is valid
 *
 * @param {Object} step - A step object
 * @param {boolean} debug
 *
 * @returns {boolean} - True if the step is valid, false otherwise
 */
function validateStep(step) {
  var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (!is.plainObject(step)) {
    log({
      title: 'validateStep',
      data: 'step must be an object',
      warn: true,
      debug: debug
    });
    return false;
  }

  if (!step.target) {
    log({
      title: 'validateStep',
      data: 'target is missing from the step',
      warn: true,
      debug: debug
    });
    return false;
  }

  return true;
}

/**
 * Validate if steps is valid
 *
 * @param {Array} steps - A steps array
 * @param {boolean} debug
 *
 * @returns {boolean} - True if the steps are valid, false otherwise
 */
function validateSteps(steps) {
  var debug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

  if (!is.array(steps)) {
    log({
      title: 'validateSteps',
      data: 'steps must be an array',
      warn: true,
      debug: debug
    });

    return false;
  }

  return steps.every(function (d) {
    return validateStep(d, debug);
  });
}

function getTourProps(props) {
  var sharedTourProps = ['beaconComponent', 'disableCloseOnEsc', 'disableOverlay', 'disableOverlayClose', 'disableScrolling', 'floaterProps', 'hideBackButton', 'locale', 'showProgress', 'showSkipButton', 'spotlightClicks', 'spotlightPadding', 'styles', 'tooltipComponent'];

  return Object.keys(props).filter(function (d) {
    return sharedTourProps.indexOf(d) !== -1;
  }).reduce(function (acc, i) {
    acc[i] = props[i];

    return acc;
  }, {});
}

function getMergedStep(step, props) {
  if (!step) return undefined;

  var mergedStep = deepmerge.all([getTourProps(props), DEFAULTS.step, step]);
  var mergedStyles = getStyles(deepmerge(props.styles || {}, step.styles || {}));
  var scrollParent = hasCustomScrollParent(getElement(step.target));
  var floaterProps = deepmerge.all([props.floaterProps || {}, DEFAULTS.floaterProps, mergedStep.floaterProps || {}]);

  // Set react-floater props
  floaterProps.offset = mergedStep.offset;
  floaterProps.styles = deepmerge(floaterProps.styles || {}, mergedStyles.floater || {});

  if (mergedStep.floaterProps && mergedStep.floaterProps.offset) {
    floaterProps.offset = mergedStep.floaterProps.offset;
  }

  if (!mergedStep.disableScrolling) {
    floaterProps.offset += props.spotlightPadding || step.spotlightPadding || 0;
  }

  if (step.placementBeacon) {
    floaterProps.wrapperOptions.placement = step.placementBeacon;
  }

  if (scrollParent) {
    floaterProps.options.preventOverflow.boundariesElement = 'window';
  }

  return _extends({}, mergedStep, {
    locale: deepmerge(DEFAULTS.locale, props.locale || {}),
    floaterProps: floaterProps,
    styles: mergedStyles
  });
}

var EVENTS = {
  TOUR_START: 'tour:start',
  STEP_BEFORE: 'step:before',
  BEACON: 'beacon',
  TOOLTIP: 'tooltip',
  TOOLTIP_CLOSE: 'close',
  STEP_AFTER: 'step:after',
  TOUR_END: 'tour:end',
  TOUR_STATUS: 'tour:status',
  TARGET_NOT_FOUND: 'error:target_not_found',
  ERROR: 'error'
};

var validTabNodes = /input|select|textarea|button|object/;
var TAB_KEY = 9;
var modalElement = null;

function isHidden(element) {
  var noSize = element.offsetWidth <= 0 && element.offsetHeight <= 0;

  if (noSize && !element.innerHTML) return true;

  var style = window.getComputedStyle(element);
  return noSize ? style.getPropertyValue('overflow') !== 'visible' : style.getPropertyValue('display') === 'none';
}

function isVisible(element) {
  var parentElement = element;
  while (parentElement) {
    if (parentElement === document.body) break;
    if (isHidden(parentElement)) return false;
    parentElement = parentElement.parentNode;
  }
  return true;
}

function canHaveFocus(element, isTabIndexNotNaN) {
  var nodeName = element.nodeName.toLowerCase();
  var res = validTabNodes.test(nodeName) && !element.disabled || (nodeName === 'a' ? element.href || isTabIndexNotNaN : isTabIndexNotNaN);
  return res && isVisible(element);
}

function canBeTabbed(element) {
  var tabIndex = element.getAttribute('tabindex');
  if (tabIndex === null) tabIndex = undefined;
  var isTabIndexNaN = isNaN(tabIndex);
  return (isTabIndexNaN || tabIndex >= 0) && canHaveFocus(element, !isTabIndexNaN);
}

function findValidTabElements(element) {
  return [].slice.call(element.querySelectorAll('*'), 0).filter(canBeTabbed);
}

function interceptTab(node, event) {
  var elements = findValidTabElements(node);
  var shiftKey = event.shiftKey;


  if (!elements.length) {
    event.preventDefault();
    return;
  }

  var x = elements.indexOf(document.activeElement);

  if (x === -1 || !shiftKey && x + 1 === elements.length) {
    x = 0;
  } else {
    x += shiftKey ? -1 : 1;
  }

  event.preventDefault();

  elements[x].focus();
}

function handleKeyDown(e) {
  if (!modalElement) {
    return;
  }

  if (e.keyCode === TAB_KEY) {
    interceptTab(modalElement, event);
  }
}

function setScope(element) {
  modalElement = element;

  window.addEventListener('keydown', handleKeyDown, false);
}

function removeScope() {
  modalElement = null;

  window.removeEventListener('keydown', handleKeyDown);
}

var JoyrideBeacon = function (_React$Component) {
  inherits(JoyrideBeacon, _React$Component);

  function JoyrideBeacon(props) {
    classCallCheck(this, JoyrideBeacon);

    var _this = possibleConstructorReturn(this, (JoyrideBeacon.__proto__ || Object.getPrototypeOf(JoyrideBeacon)).call(this, props));

    if (!props.beaconComponent) {
      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      var css = '\n@keyframes joyride-beacon-inner {\n  20% {\n    opacity: 0.9;\n  }\n\n  90% {\n    opacity: 0.7;\n  }\n}\n\n@keyframes joyride-beacon-outer {\n  0% {\n    transform: scale(1);\n  }\n\n  45% {\n    opacity: 0.7;\n    transform: scale(0.75);\n  }\n\n  100% {\n    opacity: 0.9;\n    transform: scale(1);\n  }\n}\n      ';

      style.type = 'text/css';
      style.id = 'joyride-beacon-animation';
      style.appendChild(document.createTextNode(css));

      head.appendChild(style);
    }
    return _this;
  }

  createClass(JoyrideBeacon, [{
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      var style = document.getElementById('joyride-beacon-animation');

      if (style) {
        style.parentNode.removeChild(style);
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          beaconComponent = _props.beaconComponent,
          onClickOrHover = _props.onClickOrHover,
          styles = _props.styles;

      var props = {
        'aria-label': 'Open',
        onClick: onClickOrHover,
        onMouseEnter: onClickOrHover,
        title: 'Open'
      };
      var component = void 0;

      if (beaconComponent) {
        if (React.isValidElement(beaconComponent)) {
          component = React.cloneElement(beaconComponent, props);
        } else {
          component = beaconComponent(props);
        }
      } else {
        component = React.createElement(
          'button',
          _extends({
            key: 'JoyrideBeacon',
            className: 'joyride-beacon',
            style: styles.beacon
          }, props),
          React.createElement('span', { style: styles.beaconInner }),
          React.createElement('span', { style: styles.beaconOuter })
        );
      }

      return component;
    }
  }]);
  return JoyrideBeacon;
}(React.Component);

JoyrideBeacon.propTypes = {
  beaconComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
  onClickOrHover: PropTypes.func.isRequired,
  styles: PropTypes.object.isRequired
};

var JoyrideSpotlight = function JoyrideSpotlight(_ref) {
  var styles = _ref.styles;
  return React.createElement('div', {
    key: 'JoyrideSpotlight',
    className: 'joyride-spotlight',
    style: styles
  });
};

JoyrideSpotlight.propTypes = {
  styles: PropTypes.object.isRequired
};

var Overlay = function (_React$Component) {
  inherits(Overlay, _React$Component);

  function Overlay(props) {
    classCallCheck(this, Overlay);

    var _this = possibleConstructorReturn(this, (Overlay.__proto__ || Object.getPrototypeOf(Overlay)).call(this, props));

    _this.handleMouseMove = function (e) {
      var mouseOverSpotlight = _this.state.mouseOverSpotlight;
      var _this$stylesSpotlight = _this.stylesSpotlight,
          height = _this$stylesSpotlight.height,
          left = _this$stylesSpotlight.left,
          position = _this$stylesSpotlight.position,
          top = _this$stylesSpotlight.top,
          width = _this$stylesSpotlight.width;


      var offsetY = position === 'fixed' ? e.clientY : e.pageY;
      var offsetX = position === 'fixed' ? e.clientX : e.pageX;
      var inSpotlightHeight = offsetY >= top && offsetY <= top + height;
      var inSpotlightWidth = offsetX >= left && offsetX <= left + width;
      var inSpotlight = inSpotlightWidth && inSpotlightHeight;

      if (inSpotlight !== mouseOverSpotlight) {
        _this.setState({ mouseOverSpotlight: inSpotlight });
      }
    };

    _this.state = {
      mouseOverSpotlight: false
    };
    return _this;
  }

  createClass(Overlay, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _props = this.props,
          disableScrolling = _props.disableScrolling,
          target = _props.target;


      if (!disableScrolling) {
        var element = getElement(target);
        this.scrollParent = hasCustomScrollParent(element) ? getScrollParent(element) : document;
      }
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      var lifecycle = nextProps.lifecycle,
          spotlightClicks = nextProps.spotlightClicks,
          disableOverlay = nextProps.disableOverlay;


      if (this.props.spotlightClicks !== spotlightClicks || this.props.disableOverlay !== disableOverlay || this.props.lifecycle !== lifecycle) {
        if (spotlightClicks && lifecycle === LIFECYCLE.TOOLTIP) {
          document.addEventListener('mousemove', this.handleMouseMove, false);
        } else if (lifecycle !== LIFECYCLE.TOOLTIP) {
          document.removeEventListener('mousemove', this.handleMouseMove);
        }
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      document.removeEventListener('mousemove', this.handleMouseMove);
    }
  }, {
    key: 'render',
    value: function render() {
      var _props2 = this.props,
          disableOverlay = _props2.disableOverlay,
          onClickOverlay = _props2.onClickOverlay,
          placement = _props2.placement,
          styles = _props2.styles;


      if (disableOverlay) {
        return null;
      }

      var stylesOverlay = _extends({
        cursor: disableOverlay ? 'default' : 'pointer',
        height: getDocumentHeight(),
        pointerEvents: this.state.mouseOverSpotlight ? 'none' : 'auto'
      }, isLegacy() && placement !== 'center' ? styles.overlayLegacy : styles.overlay);

      return React.createElement(
        'div',
        {
          className: 'joyride-overlay',
          style: stylesOverlay,
          onClick: onClickOverlay
        },
        placement !== 'center' && React.createElement(JoyrideSpotlight, { styles: this.stylesSpotlight })
      );
    }
  }, {
    key: 'stylesSpotlight',
    get: function get$$1() {
      var _props3 = this.props,
          spotlightClicks = _props3.spotlightClicks,
          spotlightPadding = _props3.spotlightPadding,
          styles = _props3.styles,
          target = _props3.target;

      var element = getElement(target);
      var elementRect = getClientRect(element);
      var isFixedTarget = isFixed(element);
      var top = getElementPosition(element, spotlightPadding);

      return _extends({}, isLegacy() ? styles.spotlightLegacy : styles.spotlight, {
        height: Math.round(elementRect.height + spotlightPadding * 2),
        left: Math.round(elementRect.left - spotlightPadding),
        pointerEvents: spotlightClicks ? 'none' : 'auto',
        position: isFixedTarget ? 'fixed' : 'absolute',
        top: top,
        transition: 'opacity 0.2s',
        width: Math.round(elementRect.width + spotlightPadding * 2)
      });
    }
  }]);
  return Overlay;
}(React.Component);

Overlay.propTypes = {
  disableOverlay: PropTypes.bool.isRequired,
  disableScrolling: PropTypes.bool.isRequired,
  lifecycle: PropTypes.string.isRequired,
  onClickOverlay: PropTypes.func.isRequired,
  placement: PropTypes.string.isRequired,
  spotlightClicks: PropTypes.bool.isRequired,
  spotlightPadding: PropTypes.number,
  styles: PropTypes.object.isRequired,
  target: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired
};

var CloseBtn = function CloseBtn(_ref) {
  var styles = _ref.styles,
      props = objectWithoutProperties(_ref, ['styles']);
  var color = styles.color,
      height = styles.height,
      width = styles.width,
      style = objectWithoutProperties(styles, ['color', 'height', 'width']);


  return React.createElement(
    'button',
    _extends({ style: style }, props),
    React.createElement(
      'svg',
      {
        width: width + 'px',
        height: height + 'px',
        viewBox: '0 0 18 18',
        version: '1.1',
        xmlns: 'http://www.w3.org/2000/svg',
        preserveAspectRatio: 'xMidYMid'
      },
      React.createElement(
        'g',
        null,
        React.createElement('path', {
          d: 'M8.13911129,9.00268191 L0.171521827,17.0258467 C-0.0498027049,17.248715 -0.0498027049,17.6098394 0.171521827,17.8327545 C0.28204354,17.9443526 0.427188206,17.9998706 0.572051765,17.9998706 C0.71714958,17.9998706 0.862013139,17.9443526 0.972581703,17.8327545 L9.0000937,9.74924618 L17.0276057,17.8327545 C17.1384085,17.9443526 17.2832721,17.9998706 17.4281356,17.9998706 C17.5729992,17.9998706 17.718097,17.9443526 17.8286656,17.8327545 C18.0499901,17.6098862 18.0499901,17.2487618 17.8286656,17.0258467 L9.86135722,9.00268191 L17.8340066,0.973848225 C18.0553311,0.750979934 18.0553311,0.389855532 17.8340066,0.16694039 C17.6126821,-0.0556467968 17.254037,-0.0556467968 17.0329467,0.16694039 L9.00042166,8.25611765 L0.967006424,0.167268345 C0.745681892,-0.0553188426 0.387317931,-0.0553188426 0.165993399,0.167268345 C-0.0553311331,0.390136635 -0.0553311331,0.751261038 0.165993399,0.974176179 L8.13920499,9.00268191 L8.13911129,9.00268191 Z',
          fill: color
        })
      )
    )
  );
};

CloseBtn.propTypes = {
  styles: PropTypes.object.isRequired
};

var JoyrideTooltipContainer = function JoyrideTooltipContainer(_ref) {
  var continuous = _ref.continuous,
      backProps = _ref.backProps,
      closeProps = _ref.closeProps,
      primaryProps = _ref.primaryProps,
      skipProps = _ref.skipProps,
      index = _ref.index,
      isLastStep = _ref.isLastStep,
      setTooltipRef = _ref.setTooltipRef,
      size = _ref.size,
      step = _ref.step;
  var content = step.content,
      hideBackButton = step.hideBackButton,
      locale = step.locale,
      showProgress = step.showProgress,
      showSkipButton = step.showSkipButton,
      title = step.title,
      styles = step.styles;
  var back = locale.back,
      close = locale.close,
      last = locale.last,
      next = locale.next,
      skip = locale.skip;

  var output = {
    primary: close
  };

  if (continuous) {
    if (isLastStep) {
      output.primary = last;
    } else {
      output.primary = next;
    }

    if (showProgress) {
      output.primary += ' (' + (index + 1) + '/' + size + ')';
    }
  }

  if (showSkipButton && !isLastStep) {
    output.skip = React.createElement(
      'button',
      _extends({ style: styles.buttonSkip }, skipProps),
      skip
    );
  }

  if (!hideBackButton && index > 0) {
    output.back = React.createElement(
      'button',
      _extends({ style: styles.buttonBack }, backProps),
      back
    );
  }

  output.close = React.createElement(CloseBtn, _extends({}, closeProps, { styles: styles.buttonClose }));

  return React.createElement(
    'div',
    {
      key: 'JoyrideTooltip',
      ref: setTooltipRef,
      style: styles.tooltip
    },
    React.createElement(
      'div',
      { style: styles.tooltipContainer },
      output.close,
      title && React.createElement(
        'h4',
        { style: styles.tooltipTitle },
        title
      ),
      !!content && React.createElement(
        'div',
        { style: styles.tooltipContent },
        content
      )
    ),
    React.createElement(
      'div',
      { style: styles.tooltipFooter },
      output.skip,
      output.back,
      React.createElement(
        'button',
        _extends({ style: styles.buttonNext }, primaryProps),
        output.primary
      )
    )
  );
};

JoyrideTooltipContainer.propTypes = {
  backProps: PropTypes.object.isRequired,
  closeProps: PropTypes.object.isRequired,
  continuous: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
  isLastStep: PropTypes.bool.isRequired,
  primaryProps: PropTypes.object.isRequired,
  setTooltipRef: PropTypes.func.isRequired,
  size: PropTypes.number.isRequired,
  skipProps: PropTypes.object.isRequired,
  step: PropTypes.object.isRequired
};

var JoyrideTooltip = function (_React$Component) {
  inherits(JoyrideTooltip, _React$Component);

  function JoyrideTooltip() {
    var _ref;

    var _temp, _this, _ret;

    classCallCheck(this, JoyrideTooltip);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = possibleConstructorReturn(this, (_ref = JoyrideTooltip.__proto__ || Object.getPrototypeOf(JoyrideTooltip)).call.apply(_ref, [this].concat(args))), _this), _this.handleClickBack = function (e) {
      e.preventDefault();

      _this.props.helpers.prev();
    }, _this.handleClickClose = function (e) {
      e.preventDefault();

      _this.props.helpers.close();
    }, _this.handleClickPrimary = function (e) {
      e.preventDefault();
      var continuous = _this.props.continuous;


      if (!continuous) {
        _this.props.helpers.close();
        return;
      }

      _this.props.helpers.next();
    }, _this.handleClickSkip = function (e) {
      e.preventDefault();

      _this.props.helpers.skip();
    }, _temp), possibleConstructorReturn(_this, _ret);
  }

  createClass(JoyrideTooltip, [{
    key: 'render',
    value: function render() {
      var _props = this.props,
          continuous = _props.continuous,
          index = _props.index,
          isLastStep = _props.isLastStep,
          setTooltipRef = _props.setTooltipRef,
          size = _props.size,
          step = _props.step;
      var content = step.content,
          locale = step.locale,
          title = step.title,
          tooltipComponent = step.tooltipComponent;
      var back = locale.back,
          close = locale.close,
          last = locale.last,
          next = locale.next,
          skip = locale.skip;

      var primaryText = continuous ? next : close;

      if (isLastStep) {
        primaryText = last;
      }

      var component = void 0;
      var buttonProps = {
        backProps: { 'aria-label': back, onClick: this.handleClickBack, role: 'button', title: back },
        closeProps: { 'aria-label': close, onClick: this.handleClickClose, role: 'button', title: close },
        primaryProps: { 'aria-label': primaryText, onClick: this.handleClickPrimary, role: 'button', title: primaryText },
        skipProps: { 'aria-label': skip, onClick: this.handleClickSkip, role: 'button', title: skip }
      };

      if (tooltipComponent) {
        var renderProps = _extends({}, buttonProps, {
          content: content,
          continuous: continuous,
          index: index,
          isLastStep: isLastStep,
          locale: locale,
          setTooltipRef: setTooltipRef,
          size: size,
          title: title
        });

        if (React.isValidElement(tooltipComponent)) {
          component = React.cloneElement(tooltipComponent, renderProps);
        } else {
          component = tooltipComponent(renderProps);
        }
      } else {
        component = React.createElement(JoyrideTooltipContainer, _extends({
          continuous: continuous,
          index: index,
          isLastStep: isLastStep,
          setTooltipRef: setTooltipRef,
          size: size,
          step: step
        }, buttonProps));
      }

      return component;
    }
  }]);
  return JoyrideTooltip;
}(React.Component);

JoyrideTooltip.propTypes = {
  continuous: PropTypes.bool.isRequired,
  helpers: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  isLastStep: PropTypes.bool.isRequired,
  setTooltipRef: PropTypes.func.isRequired,
  size: PropTypes.number.isRequired,
  step: PropTypes.object.isRequired
};

var JoyridePortal = function (_React$Component) {
  inherits(JoyridePortal, _React$Component);

  function JoyridePortal(props) {
    classCallCheck(this, JoyridePortal);

    var _this = possibleConstructorReturn(this, (JoyridePortal.__proto__ || Object.getPrototypeOf(JoyridePortal)).call(this, props));

    if (!canUseDOM) return possibleConstructorReturn(_this);

    _this.node = document.createElement('div');
    if (props.id) {
      _this.node.id = props.id;
    }

    document.body.appendChild(_this.node);
    return _this;
  }

  createClass(JoyridePortal, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      if (!canUseDOM) return;

      if (!isReact16) {
        this.renderReact15();
      }
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {
      if (!canUseDOM) return;

      if (!isReact16) {
        this.renderReact15();
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      if (!canUseDOM || !this.node) return;

      if (!isReact16) {
        ReactDOM.unmountComponentAtNode(this.node);
      }

      document.body.removeChild(this.node);
    }
  }, {
    key: 'renderReact15',
    value: function renderReact15() {
      if (!canUseDOM) return null;

      var children = this.props.children;


      ReactDOM.unstable_renderSubtreeIntoContainer(this, children, this.node);

      return null;
    }
  }, {
    key: 'renderReact16',
    value: function renderReact16() {
      if (!canUseDOM || !isReact16) return null;

      var children = this.props.children;


      return ReactDOM.createPortal(children, this.node);
    }
  }, {
    key: 'render',
    value: function render() {
      if (!isReact16) {
        return null;
      }

      return this.renderReact16();
    }
  }]);
  return JoyridePortal;
}(React.Component);

JoyridePortal.propTypes = {
  children: PropTypes.element,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

var JoyrideStep = function (_React$Component) {
  inherits(JoyrideStep, _React$Component);

  function JoyrideStep() {
    var _ref;

    var _temp, _this, _ret;

    classCallCheck(this, JoyrideStep);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = possibleConstructorReturn(this, (_ref = JoyrideStep.__proto__ || Object.getPrototypeOf(JoyrideStep)).call.apply(_ref, [this].concat(args))), _this), _this.handleClickHoverBeacon = function (e) {
      var _this$props = _this.props,
          step = _this$props.step,
          update = _this$props.update;


      if (e.type === 'mouseenter' && step.event !== 'hover') {
        return;
      }

      update({ lifecycle: LIFECYCLE.TOOLTIP });
    }, _this.handleClickOverlay = function () {
      var _this$props2 = _this.props,
          helpers = _this$props2.helpers,
          step = _this$props2.step;


      if (!step.disableOverlayClose) {
        helpers.close();
      }
    }, _this.setTooltipRef = function (c) {
      _this.tooltip = c;
    }, _this.setPopper = function (popper, type) {
      var _this$props3 = _this.props,
          action = _this$props3.action,
          getPopper = _this$props3.getPopper,
          update = _this$props3.update;


      if (type === 'wrapper') {
        _this.beaconPopper = popper;
      } else {
        _this.tooltipPopper = popper;
      }

      getPopper(popper, type);

      if (_this.beaconPopper && _this.tooltipPopper) {
        update({
          action: action === ACTIONS.CLOSE ? ACTIONS.CLOSE : action,
          lifecycle: LIFECYCLE.READY
        });
      }
    }, _temp), possibleConstructorReturn(_this, _ret);
  }

  createClass(JoyrideStep, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _props = this.props,
          debug = _props.debug,
          lifecycle = _props.lifecycle;


      log({
        title: 'step:' + lifecycle,
        data: [{ key: 'props', value: this.props }],
        debug: debug
      });
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      var _props2 = this.props,
          action = _props2.action,
          continuous = _props2.continuous,
          debug = _props2.debug,
          index = _props2.index,
          lifecycle = _props2.lifecycle,
          step = _props2.step,
          update = _props2.update;

      var skipBeacon = continuous && action !== ACTIONS.CLOSE && (index > 0 || action === ACTIONS.PREV);

      if (lifecycle === LIFECYCLE.INIT && nextProps.lifecycle === LIFECYCLE.READY) {
        update({ lifecycle: step.disableBeacon || skipBeacon ? LIFECYCLE.TOOLTIP : LIFECYCLE.BEACON });
      }

      if (index !== nextProps.index) {
        log({
          title: 'step:' + lifecycle,
          data: [{ key: 'props', value: this.props }],
          debug: debug
        });
      }
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate(prevProps) {
      var _props3 = this.props,
          action = _props3.action,
          callback = _props3.callback,
          controlled = _props3.controlled,
          index = _props3.index,
          lifecycle = _props3.lifecycle,
          size = _props3.size,
          status = _props3.status,
          step = _props3.step,
          update = _props3.update;

      var state = { action: action, controlled: controlled, index: index, lifecycle: lifecycle, size: size, status: status };

      var isAfterAction = [ACTIONS.NEXT, ACTIONS.PREV, ACTIONS.SKIP, ACTIONS.CLOSE].indexOf(action) !== -1 && action !== prevProps.action;

      var hasChangedIndex = index !== prevProps.index && prevProps.lifecycle === LIFECYCLE.TOOLTIP && lifecycle === LIFECYCLE.INIT;

      if (status === prevProps.status && (hasChangedIndex || controlled && isAfterAction)) {
        callback(_extends({}, state, {
          index: prevProps.index,
          lifecycle: LIFECYCLE.COMPLETE,
          step: step,
          type: EVENTS.STEP_AFTER
        }));
      }

      // There's a step to use, but there's no target in the DOM
      if (step) {
        var hasRenderedTarget = !!getElement(step.target);

        if (hasRenderedTarget) {
          if (prevProps.status === STATUS.READY && status === STATUS.RUNNING || prevProps.index !== index) {
            callback(_extends({}, state, {
              step: step,
              type: EVENTS.STEP_BEFORE
            }));
          }
        }

        if (!hasRenderedTarget) {
          console.warn('Target not mounted', step); //eslint-disable-line no-console
          callback(_extends({}, state, {
            type: EVENTS.TARGET_NOT_FOUND,
            step: step
          }));

          if (!controlled) {
            update({ index: index + ([ACTIONS.PREV].indexOf(action) !== -1 ? -1 : 1) });
          }
        }
      }

      /* istanbul ignore else */
      if (prevProps.lifecycle !== LIFECYCLE.BEACON && lifecycle === LIFECYCLE.BEACON) {
        callback(_extends({}, state, {
          step: step,
          type: EVENTS.BEACON
        }));
      }

      if (prevProps.lifecycle !== LIFECYCLE.TOOLTIP && lifecycle === LIFECYCLE.TOOLTIP) {
        callback(_extends({}, state, {
          step: step,
          type: EVENTS.TOOLTIP
        }));

        setScope(this.tooltip);
      }

      if (prevProps.lifecycle !== LIFECYCLE.TOOLTIP && lifecycle === LIFECYCLE.INIT) {
        removeScope();
      }

      if (prevProps.lifecycle !== LIFECYCLE.INIT && lifecycle === LIFECYCLE.INIT) {
        delete this.beaconPopper;
        delete this.tooltipPopper;
      }
    }

    /**
     * Beacon click/hover event listener
     *
     * @param {Event} e
     */

  }, {
    key: 'render',
    value: function render() {
      var _props4 = this.props,
          continuous = _props4.continuous,
          controlled = _props4.controlled,
          debug = _props4.debug,
          helpers = _props4.helpers,
          index = _props4.index,
          lifecycle = _props4.lifecycle,
          size = _props4.size,
          step = _props4.step;

      var target = getElement(step.target);

      if (!validateStep(step) || !is.domElement(target)) {
        return null;
      }

      return React.createElement(
        'div',
        { key: 'JoyrideStep-' + index, className: 'joyride-step' },
        React.createElement(
          JoyridePortal,
          null,
          React.createElement(Overlay, _extends({}, step, {
            lifecycle: lifecycle,
            onClickOverlay: this.handleClickOverlay
          }))
        ),
        React.createElement(
          Floater,
          _extends({
            component: React.createElement(JoyrideTooltip, {
              continuous: continuous,
              controlled: controlled,
              helpers: helpers,
              index: index,
              setTooltipRef: this.setTooltipRef,
              size: size,
              isLastStep: index + 1 === size,
              step: step
            }),
            debug: debug,
            getPopper: this.setPopper,
            id: 'react-joyride:' + index,
            isPositioned: step.isFixed || isFixed(target),
            open: this.open,
            placement: step.placement,
            target: step.target
          }, step.floaterProps),
          React.createElement(JoyrideBeacon, {
            beaconComponent: step.beaconComponent,
            onClickOrHover: this.handleClickHoverBeacon,
            styles: step.styles
          })
        )
      );
    }
  }, {
    key: 'open',
    get: function get$$1() {
      var _props5 = this.props,
          step = _props5.step,
          lifecycle = _props5.lifecycle;


      return !!(step.disableBeacon || lifecycle === LIFECYCLE.TOOLTIP);
    }
  }]);
  return JoyrideStep;
}(React.Component);

JoyrideStep.propTypes = {
  action: PropTypes.string.isRequired,
  callback: PropTypes.func.isRequired,
  continuous: PropTypes.bool.isRequired,
  controlled: PropTypes.bool.isRequired,
  debug: PropTypes.bool.isRequired,
  getPopper: PropTypes.func.isRequired,
  helpers: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  lifecycle: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  status: PropTypes.string.isRequired,
  step: PropTypes.shape({
    beaconComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
    content: isRequiredIf(PropTypes.node, function (props) {
      return !props.tooltipComponent && !props.title;
    }),
    disableBeacon: PropTypes.bool,
    disableOverlay: PropTypes.bool,
    disableOverlayClose: PropTypes.bool,
    event: PropTypes.string,
    floaterProps: PropTypes.shape({
      offset: PropTypes.number
    }),
    hideBackButton: PropTypes.bool,
    isFixed: PropTypes.bool,
    locale: PropTypes.object,
    offset: PropTypes.number.isRequired,
    placement: PropTypes.oneOf(['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'left', 'left-start', 'left-end', 'right', 'right-start', 'right-end', 'auto', 'center']),
    spotlightClicks: PropTypes.bool,
    spotlightPadding: PropTypes.number,
    target: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
    styles: PropTypes.object,
    title: PropTypes.node,
    tooltipComponent: isRequiredIf(PropTypes.oneOfType([PropTypes.func, PropTypes.element]), function (props) {
      return !props.content && !props.title;
    })
  }).isRequired,
  update: PropTypes.func.isRequired
};

var Joyride = function (_React$Component) {
  inherits(Joyride, _React$Component);

  function Joyride(props) {
    classCallCheck(this, Joyride);

    var _this = possibleConstructorReturn(this, (Joyride.__proto__ || Object.getPrototypeOf(Joyride)).call(this, props));

    _this.callback = function (data) {
      var callback = _this.props.callback;

      /* istanbul ignore else */

      if (is.function(callback)) {
        callback(data);
      }
    };

    _this.handleKeyboard = function (e) {
      var _this$state = _this.state,
          index = _this$state.index,
          lifecycle = _this$state.lifecycle;
      var steps = _this.props.steps;

      var step = steps[index];
      var intKey = window.Event ? e.which : e.keyCode;

      if (lifecycle === LIFECYCLE.TOOLTIP) {
        if (intKey === 27 && step && !step.disableCloseOnEsc) {
          _this.store.close();
        }
      }
    };

    _this.syncState = function (state) {
      _this.setState(state);
    };

    _this.getPopper = function (popper, type) {
      if (type === 'wrapper') {
        _this.beaconPopper = popper;
      } else {
        _this.tooltipPopper = popper;
      }
    };

    _this.store = new createStore(_extends({}, props, {
      controlled: props.run && is.number(props.stepIndex)
    }));
    _this.state = _this.store.getState();
    _this.helpers = _this.store.getHelpers();
    return _this;
  }

  createClass(Joyride, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      if (!canUseDOM) return;

      var _props = this.props,
          debug = _props.debug,
          disableCloseOnEsc = _props.disableCloseOnEsc,
          run = _props.run,
          steps = _props.steps;
      var start = this.store.start;


      log({
        title: 'init',
        data: [{ key: 'props', value: this.props }, { key: 'state', value: this.state }],
        debug: debug
      });

      // Sync the store to this component state.
      this.store.addListener(this.syncState);

      if (validateSteps(steps, debug) && run) {
        start();
      }

      /* istanbul ignore else */
      if (!disableCloseOnEsc) {
        document.body.addEventListener('keydown', this.handleKeyboard, { passive: true });
      }
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      if (!canUseDOM) return;
      var _state = this.state,
          action = _state.action,
          status = _state.status;
      var _props2 = this.props,
          steps = _props2.steps,
          stepIndex = _props2.stepIndex,
          run = _props2.run;
      var debug = nextProps.debug,
          nextRun = nextProps.run,
          nextSteps = nextProps.steps,
          nextStepIndex = nextProps.stepIndex;
      var _store = this.store,
          setSteps = _store.setSteps,
          start = _store.start,
          stop = _store.stop,
          update = _store.update;

      var diffProps = !isEqual(this.props, nextProps);

      if (diffProps) {
        log({
          title: 'props',
          data: [{ key: 'nextProps', value: nextProps }, { key: 'props', value: this.props }],
          debug: debug
        });

        var stepsChanged = !isEqual(nextSteps, steps);
        var stepIndexChanged = is.number(nextStepIndex) && stepIndex !== nextStepIndex;

        /* istanbul ignore else */
        if (nextRun && !run) {
          start();
        }
        if (!nextRun && run) {
          stop();
        }

        if (stepsChanged) {
          if (validateSteps(nextSteps, debug)) {
            setSteps(nextSteps);
          } else {
            console.warn('Steps are not valid', nextSteps); //eslint-disable-line no-console
          }
        }

        /* istanbul ignore else */
        if (stepIndexChanged) {
          var nextAction = stepIndex < nextStepIndex ? ACTIONS.NEXT : ACTIONS.PREV;

          if (action === ACTIONS.STOP) {
            nextAction = ACTIONS.START;
          }

          if (!([STATUS.FINISHED, STATUS.SKIPPED].indexOf(status) !== -1)) {
            update({
              action: action === ACTIONS.CLOSE ? ACTIONS.CLOSE : nextAction,
              index: nextStepIndex,
              lifecycle: LIFECYCLE.INIT
            });
          }
        }
      }
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate(prevProps, prevState) {
      if (!canUseDOM) return;

      var _state2 = this.state,
          index = _state2.index,
          lifecycle = _state2.lifecycle,
          status = _state2.status;
      var steps = this.props.steps;

      var step = getMergedStep(steps[index], this.props);
      var diffState = !isEqual(prevState, this.state);

      if (diffState) {
        log({
          title: 'state',
          data: [{ key: 'state', value: this.state }, { key: 'changed', value: diffState }, { key: 'step', value: step }],
          debug: this.props.debug
        });

        if (status !== prevState.status) {
          var type = EVENTS.TOUR_STATUS;

          if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            type = EVENTS.TOUR_END;
          } else if (prevState.status === STATUS.READY && status === STATUS.RUNNING) {
            type = EVENTS.TOUR_START;
          }

          this.callback(_extends({}, this.state, {
            step: step,
            type: type
          }));
        }

        if (step) {
          this.scrollToStep(prevState);

          if (step.placement === 'center' && status === STATUS.RUNNING && lifecycle === LIFECYCLE.INIT) {
            this.store.update({ lifecycle: LIFECYCLE.READY });
          }
        }

        if (prevState.lifecycle !== lifecycle && lifecycle === LIFECYCLE.INIT) {
          delete this.beaconPopper;
          delete this.tooltipPopper;
        }
      }
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      var disableCloseOnEsc = this.props.disableCloseOnEsc;

      /* istanbul ignore else */

      if (!disableCloseOnEsc) {
        document.body.removeEventListener('keydown', this.handleKeyboard);
      }
    }
  }, {
    key: 'scrollToStep',
    value: function scrollToStep(prevState) {
      var _state3 = this.state,
          index = _state3.index,
          lifecycle = _state3.lifecycle,
          status = _state3.status;
      var _props3 = this.props,
          debug = _props3.debug,
          disableScrolling = _props3.disableScrolling,
          scrollToFirstStep = _props3.scrollToFirstStep,
          scrollOffset = _props3.scrollOffset,
          steps = _props3.steps;

      var step = getMergedStep(steps[index], this.props);

      if (step) {
        var target = getElement(step.target);

        var shouldScroll = step && !disableScrolling && (!step.isFixed || !isFixed(target)) // fixed steps don't need to scroll
        && prevState.lifecycle !== lifecycle && [LIFECYCLE.BEACON, LIFECYCLE.TOOLTIP].indexOf(lifecycle) !== -1 && (scrollToFirstStep || prevState.index !== index);

        if (status === STATUS.RUNNING && shouldScroll) {
          var hasCustomScroll = hasCustomScrollParent(target);
          var scrollParent = getScrollParent(target);
          var scrollY = Math.floor(getScrollTo(target, scrollOffset));

          log({
            title: 'scrollToStep',
            data: [{ key: 'index', value: index }, { key: 'lifecycle', value: lifecycle }, { key: 'status', value: status }],
            debug: debug
          });

          if (lifecycle === LIFECYCLE.BEACON && this.beaconPopper) {
            var _beaconPopper = this.beaconPopper,
                placement = _beaconPopper.placement,
                popper = _beaconPopper.popper;


            if (!(['bottom'].indexOf(placement) !== -1) && !hasCustomScroll) {
              scrollY = Math.floor(popper.top - scrollOffset);
            }
          } else if (lifecycle === LIFECYCLE.TOOLTIP && this.tooltipPopper) {
            var _tooltipPopper = this.tooltipPopper,
                flipped = _tooltipPopper.flipped,
                _placement = _tooltipPopper.placement,
                _popper = _tooltipPopper.popper;


            if (['top', 'right'].indexOf(_placement) !== -1 && !flipped && !hasCustomScroll) {
              scrollY = Math.floor(_popper.top - scrollOffset);
            } else {
              scrollY -= step.spotlightPadding;
            }
          }

          if (status === STATUS.RUNNING && shouldScroll && scrollY >= 0) {
            scrollTo(scrollY, scrollParent);
          }
        }
      }
    }

    /**
     * Trigger the callback.
     *
     * @private
     * @param {Object} data
     */


    /**
     * Keydown event listener
     *
     * @private
     * @param {Event} e - Keyboard event
     */


    /**
     * Sync the store with the component's state
     *
     * @param {Object} state
     */

  }, {
    key: 'render',
    value: function render() {
      if (!canUseDOM) return null;

      var _state4 = this.state,
          index = _state4.index,
          status = _state4.status;
      var _props4 = this.props,
          continuous = _props4.continuous,
          debug = _props4.debug,
          disableScrolling = _props4.disableScrolling,
          steps = _props4.steps;

      var step = getMergedStep(steps[index], this.props);
      var output = void 0;

      if (status === STATUS.RUNNING && step) {
        output = React.createElement(JoyrideStep, _extends({}, this.state, {
          callback: this.callback,
          continuous: continuous,
          debug: debug,
          disableScrolling: disableScrolling,
          getPopper: this.getPopper,
          helpers: this.helpers,
          step: step,
          update: this.store.update
        }));
      }

      return React.createElement(
        'div',
        { className: 'joyride' },
        output
      );
    }
  }]);
  return Joyride;
}(React.Component);

Joyride.propTypes = {
  beaconComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.element]),
  callback: PropTypes.func,
  continuous: PropTypes.bool,
  debug: PropTypes.bool,
  disableCloseOnEsc: PropTypes.bool,
  disableOverlay: PropTypes.bool,
  disableOverlayClose: PropTypes.bool,
  disableScrolling: PropTypes.bool,
  floaterProps: PropTypes.shape({
    offset: PropTypes.number
  }),
  hideBackButton: PropTypes.bool,
  locale: PropTypes.object,
  run: PropTypes.bool,
  scrollOffset: PropTypes.number,
  scrollToFirstStep: PropTypes.bool,
  showProgress: PropTypes.bool,
  showSkipButton: PropTypes.bool,
  spotlightClicks: PropTypes.bool,
  spotlightPadding: PropTypes.number,
  stepIndex: PropTypes.number,
  steps: PropTypes.array,
  styles: PropTypes.object,
  tooltipComponent: PropTypes.oneOfType([PropTypes.func, PropTypes.element])
};
Joyride.defaultProps = {
  continuous: false,
  debug: false,
  disableCloseOnEsc: false,
  disableOverlay: false,
  disableOverlayClose: false,
  disableScrolling: false,
  hideBackButton: false,
  run: true,
  scrollOffset: 20,
  scrollToFirstStep: false,
  showSkipButton: false,
  showProgress: false,
  spotlightClicks: false,
  spotlightPadding: 10,
  steps: []
};

exports.default = Joyride;
