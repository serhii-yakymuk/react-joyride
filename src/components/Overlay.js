import React from 'react';
import PropTypes from 'prop-types';

import {
  getClientRect,
  getDocumentHeight,
  getElement,
  getElementPosition,
  getScrollParent,
  hasCustomScrollParent,
  isFixed,
} from '../modules/dom';
import { isLegacy } from '../modules/helpers';

import LIFECYCLE from '../constants/lifecycle';

import Spotlight from './Spotlight';

export default class Overlay extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      mouseOverSpotlight: false,
    };
  }

  static propTypes = {
    disableOverlay: PropTypes.bool.isRequired,
    disableScrolling: PropTypes.bool.isRequired,
    lifecycle: PropTypes.string.isRequired,
    onClickOverlay: PropTypes.func.isRequired,
    placement: PropTypes.string.isRequired,
    spotlightClicks: PropTypes.bool.isRequired,
    spotlightPadding: PropTypes.number,
    styles: PropTypes.object.isRequired,
    target: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.string,
    ]).isRequired,
  };

  componentDidMount() {
    const { disableScrolling, target } = this.props;

    if (!disableScrolling) {
      const element = getElement(target);
      this.scrollParent = hasCustomScrollParent(element) ? getScrollParent(element) : document;
    }
  }

  componentWillReceiveProps(nextProps) {
    const { lifecycle, spotlightClicks, disableOverlay } = nextProps;

    if (
      this.props.spotlightClicks !== spotlightClicks ||
      this.props.disableOverlay !== disableOverlay ||
      this.props.lifecycle !== lifecycle
    ) {
      if (spotlightClicks && lifecycle === LIFECYCLE.TOOLTIP) {
        document.addEventListener('mousemove', this.handleMouseMove, false);
      }
      else if (lifecycle !== LIFECYCLE.TOOLTIP) {
        document.removeEventListener('mousemove', this.handleMouseMove);
      }
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove = (e) => {
    const { mouseOverSpotlight } = this.state;
    const { height, left, position, top, width } = this.stylesSpotlight;

    const offsetY = position === 'fixed' ? e.clientY : e.pageY;
    const offsetX = position === 'fixed' ? e.clientX : e.pageX;
    const inSpotlightHeight = (offsetY >= top && offsetY <= top + height);
    const inSpotlightWidth = (offsetX >= left && offsetX <= left + width);
    const inSpotlight = inSpotlightWidth && inSpotlightHeight;

    if (inSpotlight !== mouseOverSpotlight) {
      this.setState({ mouseOverSpotlight: inSpotlight });
    }
  };

  get stylesSpotlight() {
    const { spotlightClicks, spotlightPadding, styles, target } = this.props;
    const element = getElement(target);
    const elementRect = getClientRect(element);
    const isFixedTarget = isFixed(element);
    const top = getElementPosition(element, spotlightPadding);

    return {
      ...(isLegacy() ? styles.spotlightLegacy : styles.spotlight),
      height: Math.round(elementRect.height + (spotlightPadding * 2)),
      left: Math.round(elementRect.left - spotlightPadding),
      pointerEvents: spotlightClicks ? 'none' : 'auto',
      position: isFixedTarget ? 'fixed' : 'absolute',
      top,
      transition: 'opacity 0.2s',
      width: Math.round(elementRect.width + (spotlightPadding * 2)),
    };
  }

  render() {
    const {
      disableOverlay,
      onClickOverlay,
      placement,
      styles,
    } = this.props;

    if (disableOverlay) {
      return null;
    }

    const stylesOverlay = {
      cursor: disableOverlay ? 'default' : 'pointer',
      height: getDocumentHeight(),
      pointerEvents: this.state.mouseOverSpotlight ? 'none' : 'auto',
      ...(isLegacy() && placement !== 'center' ? styles.overlayLegacy : styles.overlay),
    };

    return (
      <div
        className="joyride-overlay"
        style={stylesOverlay}
        onClick={onClickOverlay}
      >
        {placement !== 'center' && (
          <Spotlight styles={this.stylesSpotlight} />
        )}
      </div>
    );
  }
}
