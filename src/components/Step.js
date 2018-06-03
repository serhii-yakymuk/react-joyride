import React from 'react';
import PropTypes from 'prop-types';
import isRequiredIf from 'react-proptype-conditional-require';
import Floater from 'react-floater';
import is from 'is-lite';

import ACTIONS from '../constants/actions';
import LIFECYCLE from '../constants/lifecycle';

import { getElement, isFixed } from '../modules/dom';
import { log } from '../modules/helpers';
import { setScope, removeScope } from '../modules/scope';
import { validateStep } from '../modules/step';

import Beacon from './Beacon';
import Overlay from './Overlay';
import Tooltip from './Tooltip/index';
import JoyridePortal from './Portal';
import EVENTS from '../constants/events';
import STATUS from '../constants/status';

export default class JoyrideStep extends React.Component {
  static propTypes = {
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
      beaconComponent: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.element,
      ]),
      content: isRequiredIf(PropTypes.node, props => !props.tooltipComponent && !props.title),
      disableBeacon: PropTypes.bool,
      disableOverlay: PropTypes.bool,
      disableOverlayClose: PropTypes.bool,
      event: PropTypes.string,
      floaterProps: PropTypes.shape({
        offset: PropTypes.number,
      }),
      hideBackButton: PropTypes.bool,
      isFixed: PropTypes.bool,
      locale: PropTypes.object,
      offset: PropTypes.number.isRequired,
      placement: PropTypes.oneOf([
        'top', 'top-start', 'top-end',
        'bottom', 'bottom-start', 'bottom-end',
        'left', 'left-start', 'left-end',
        'right', 'right-start', 'right-end',
        'auto', 'center',
      ]),
      spotlightClicks: PropTypes.bool,
      spotlightPadding: PropTypes.number,
      target: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string,
      ]).isRequired,
      styles: PropTypes.object,
      title: PropTypes.node,
      tooltipComponent: isRequiredIf(PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.element,
      ]), props => !props.content && !props.title),
    }).isRequired,
    update: PropTypes.func.isRequired,
  };

  componentDidMount() {
    const { debug, lifecycle } = this.props;

    log({
      title: `step:${lifecycle}`,
      data: [
        { key: 'props', value: this.props },
      ],
      debug,
    });
  }

  componentWillReceiveProps(nextProps) {
    const { action, continuous, debug, index, lifecycle, step, update } = this.props;
    const skipBeacon = continuous && action !== ACTIONS.CLOSE && (index > 0 || action === ACTIONS.PREV);

    if (lifecycle === LIFECYCLE.INIT && nextProps.lifecycle === LIFECYCLE.READY) {
      update({ lifecycle: step.disableBeacon || skipBeacon ? LIFECYCLE.TOOLTIP : LIFECYCLE.BEACON });
    }

    if (index !== nextProps.index) {
      log({
        title: `step:${lifecycle}`,
        data: [
          { key: 'props', value: this.props },
        ],
        debug,
      });
    }
  }

  componentDidUpdate(prevProps) {
    const { action, callback, controlled, index, lifecycle, size, status, step, update } = this.props;
    const state = { action, controlled, index, lifecycle, size, status };

    const isAfterAction = [
      ACTIONS.NEXT,
      ACTIONS.PREV,
      ACTIONS.SKIP,
      ACTIONS.CLOSE,
    ].includes(action) && action !== prevProps.action;

    const hasChangedIndex = index !== prevProps.index && prevProps.lifecycle === LIFECYCLE.TOOLTIP && lifecycle === LIFECYCLE.INIT;

    if (status === prevProps.status && (hasChangedIndex || (controlled && isAfterAction))) {
      callback({
        ...state,
        index: prevProps.index,
        lifecycle: LIFECYCLE.COMPLETE,
        step,
        type: EVENTS.STEP_AFTER,
      });
    }

    // There's a step to use, but there's no target in the DOM
    if (step) {
      const hasRenderedTarget = !!getElement(step.target);

      if (hasRenderedTarget) {
        if ((prevProps.status === STATUS.READY && status === STATUS.RUNNING) || prevProps.index !== index) {
          callback({
            ...state,
            step,
            type: EVENTS.STEP_BEFORE,
          });
        }
      }

      if (!hasRenderedTarget) {
        console.warn('Target not mounted', step); //eslint-disable-line no-console
        callback({
          ...state,
          type: EVENTS.TARGET_NOT_FOUND,
          step,
        });

        if (!controlled) {
          update({ index: index + ([ACTIONS.PREV].includes(action) ? -1 : 1) });
        }
      }
    }

    /* istanbul ignore else */
    if (prevProps.lifecycle !== LIFECYCLE.BEACON && lifecycle === LIFECYCLE.BEACON) {
      callback({
        ...state,
        step,
        type: EVENTS.BEACON,
      });
    }

    if (prevProps.lifecycle !== LIFECYCLE.TOOLTIP && lifecycle === LIFECYCLE.TOOLTIP) {
      callback({
        ...state,
        step,
        type: EVENTS.TOOLTIP,
      });

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
  handleClickHoverBeacon = (e) => {
    const { step, update } = this.props;

    if (e.type === 'mouseenter' && step.event !== 'hover') {
      return;
    }

    update({ lifecycle: LIFECYCLE.TOOLTIP });
  };

  handleClickOverlay = () => {
    const { helpers, step } = this.props;

    if (!step.disableOverlayClose) {
      helpers.close();
    }
  };

  setTooltipRef = (c) => {
    this.tooltip = c;
  };

  setPopper = (popper, type) => {
    const { action, getPopper, update } = this.props;

    if (type === 'wrapper') {
      this.beaconPopper = popper;
    }
    else {
      this.tooltipPopper = popper;
    }

    getPopper(popper, type);

    if (this.beaconPopper && this.tooltipPopper) {
      update({
        action: action === ACTIONS.CLOSE ? ACTIONS.CLOSE : action,
        lifecycle: LIFECYCLE.READY,
      });
    }
  };

  get open() {
    const { step, lifecycle } = this.props;

    return !!(step.disableBeacon || lifecycle === LIFECYCLE.TOOLTIP);
  }

  render() {
    const {
      continuous,
      controlled,
      debug,
      helpers,
      index,
      lifecycle,
      size,
      step,
    } = this.props;
    const target = getElement(step.target);

    if (!validateStep(step) || !is.domElement(target)) {
      return null;
    }

    return (
      <div key={`JoyrideStep-${index}`} className="joyride-step">
        <JoyridePortal>
          <Overlay
            {...step}
            lifecycle={lifecycle}
            onClickOverlay={this.handleClickOverlay}
          />
        </JoyridePortal>
        <Floater
          component={(
            <Tooltip
              continuous={continuous}
              controlled={controlled}
              helpers={helpers}
              index={index}
              setTooltipRef={this.setTooltipRef}
              size={size}
              isLastStep={index + 1 === size}
              step={step}
            />
          )}
          debug={debug}
          getPopper={this.setPopper}
          id={`react-joyride:${index}`}
          isPositioned={step.isFixed || isFixed(target)}
          open={this.open}
          placement={step.placement}
          target={step.target}
          {...step.floaterProps}
        >
          <Beacon
            beaconComponent={step.beaconComponent}
            onClickOrHover={this.handleClickHoverBeacon}
            styles={step.styles}
          />
        </Floater>
      </div>
    );
  }
}
