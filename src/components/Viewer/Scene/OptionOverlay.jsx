//@flow

import _ from 'lodash';
import React, { Fragment } from 'react';
import { css, StyleSheet } from 'aphrodite/no-important';
import { fixed } from 'styles/common';

import { WithOperation } from 'components/Viewer/OperationContext';
import { unescapeName } from 'polyhedra/names';
import IconLink from 'components/Viewer/IconLink';
import Menu from 'components/Viewer/Menu';
import Title from './Title';
import TwistOptions from './TwistOptions';
import AugmentOptions from './AugmentOptions';

const styles = StyleSheet.create({
  title: {
    ...fixed('bottom', 'right'),
    padding: 36,
    maxWidth: '50%',
    textAlign: 'right',
  },
  sidebarToggle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlayContainer: {
    position: 'absolute',
    right: 0,
    left: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
});

function OperationOverlay(props) {
  const { opName, solid, panel, applyOperation } = props;
  return (
    <Fragment>
      <div className={css(styles.sidebarToggle)}>
        {panel === 'full' ? (
          <Menu solid={solid} compact />
        ) : (
          <IconLink
            iconName="chevron-left"
            iconOnly
            title="hide menu"
            replace
            to={`/${solid}/${panel === 'full' ? 'related' : 'full'}`}
          />
        )}
      </div>
      <div className={css(styles.title)}>
        <Title name={unescapeName(solid)} />
      </div>
      {_.includes(['shorten', 'snub', 'gyroelongate'], opName) && (
        <div className={css(styles.overlayContainer)}>
          <TwistOptions onClick={twist => applyOperation(opName, { twist })} />
        </div>
      )}
      {_.includes(['augment'], opName) && (
        <div className={css(styles.overlayContainer)}>
          <AugmentOptions solid={solid} />
        </div>
      )}
    </Fragment>
  );
}
export default (props: *) => (
  <WithOperation>
    {operationProps => (
      <OperationOverlay
        {...props}
        {..._.pick(operationProps, ['opName', 'applyOperation'])}
      />
    )}
  </WithOperation>
);