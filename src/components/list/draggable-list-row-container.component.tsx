import { makeStyles, Theme } from '@material-ui/core';
import { StyleRules, WithStylesOptions } from '@material-ui/core/styles/withStyles';
import { DragIndicator as DragIndicatorIcon, SvgIconComponent } from '@material-ui/icons';
import React, { PropsWithChildren } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { StyleUtils } from '../../utils/style.utils';
import listRowStyle from './list-row-style';

type Props = PropsWithChildren<{
    classes?: any;
    draggableId: string;
    index: number;
    dragHandleIcon?: SvgIconComponent;
    // TODO Add option(s) to hide/disable drag handle.
}>;

const DefaultDragHandleIcon = DragIndicatorIcon;

const style = (theme: Theme) => ({
    ...listRowStyle(theme),
    draggable: {
        display: 'flex',
        alignItems: 'center'
    },
    dragging: {
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    dragHandle: {
        margin: theme.spacing(0, -2, 0, 1),
        opacity: 0.5
    }
} as StyleRules);

const styleOptions: WithStylesOptions<Theme> = {
    classNamePrefix: 'DraggableListRowContainer'
};

const useStyles = makeStyles(style, styleOptions);

export const DraggableListRowContainer = React.memo((props: Props) => {

    const {
        children,
        draggableId,
        index,
        dragHandleIcon
    } = props;

    const classes = useStyles(props);

    const DragHandleIcon = dragHandleIcon ?? DefaultDragHandleIcon;

    return (
        <Draggable draggableId={draggableId} index={index}>
            {(provided, snapshot) => {
                const className = StyleUtils.appendClassNames(
                    classes.row,
                    classes.draggable,
                    snapshot.isDragging && classes.dragging,
                );
                return (
                    <div ref={provided.innerRef} {...provided.draggableProps} className={className}>
                        <div {...provided.dragHandleProps} className={classes.dragHandle}>
                            <DragHandleIcon />
                        </div>
                        {children}
                    </div>
                );
            }}
        </Draggable>
    );

});
