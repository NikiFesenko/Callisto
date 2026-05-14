import React from 'react';
import { View, Text as RNText, Pressable, Switch as RNSwitch, ViewStyle, TextStyle, ViewProps, TextProps, PressableProps } from 'react-native';

const resolveToken = (val: any) => {
  if (typeof val === 'string' && val.startsWith('$')) {
    const num = parseFloat(val.slice(1));
    return num * 4; // $1 = 4px, $4 = 16px, etc.
  }
  return val;
};

export interface StackProps extends ViewProps {
  gap?: number | string;
  padding?: number | string;
  paddingHorizontal?: number | string;
  paddingVertical?: number | string;
  paddingTop?: number | string;
  paddingBottom?: number | string;
  paddingLeft?: number | string;
  paddingRight?: number | string;
  margin?: number | string;
  marginTop?: number | string;
  marginBottom?: number | string;
  marginLeft?: number | string;
  marginRight?: number | string;
  alignItems?: ViewStyle['alignItems'];
  justifyContent?: ViewStyle['justifyContent'];
  flexDirection?: ViewStyle['flexDirection'];
  flexWrap?: ViewStyle['flexWrap'];
  flex?: ViewStyle['flex'];
  backgroundColor?: ViewStyle['backgroundColor'];
  borderRadius?: ViewStyle['borderRadius'];
  borderWidth?: ViewStyle['borderWidth'];
  borderColor?: ViewStyle['borderColor'];
  borderBottomWidth?: ViewStyle['borderBottomWidth'];
  borderBottomColor?: ViewStyle['borderBottomColor'];
  borderTopWidth?: ViewStyle['borderTopWidth'];
  borderTopColor?: ViewStyle['borderTopColor'];
  opacity?: ViewStyle['opacity'];
  width?: ViewStyle['width'];
  height?: ViewStyle['height'];
  minWidth?: ViewStyle['minWidth'];
  minHeight?: ViewStyle['minHeight'];
  maxWidth?: ViewStyle['maxWidth'];
  maxHeight?: ViewStyle['maxHeight'];
  position?: ViewStyle['position'];
  top?: ViewStyle['top'];
  bottom?: ViewStyle['bottom'];
  left?: ViewStyle['left'];
  right?: ViewStyle['right'];
  overflow?: ViewStyle['overflow'];
  zIndex?: ViewStyle['zIndex'];
  children?: React.ReactNode;
}

const buildViewStyle = (props: StackProps): ViewStyle => {
  return {
    gap: resolveToken(props.gap),
    padding: resolveToken(props.padding),
    paddingHorizontal: resolveToken(props.paddingHorizontal),
    paddingVertical: resolveToken(props.paddingVertical),
    paddingTop: resolveToken(props.paddingTop),
    paddingBottom: resolveToken(props.paddingBottom),
    paddingLeft: resolveToken(props.paddingLeft),
    paddingRight: resolveToken(props.paddingRight),
    margin: resolveToken(props.margin),
    marginTop: resolveToken(props.marginTop),
    marginBottom: resolveToken(props.marginBottom),
    marginLeft: resolveToken(props.marginLeft),
    marginRight: resolveToken(props.marginRight),
    alignItems: props.alignItems,
    justifyContent: props.justifyContent,
    flexDirection: props.flexDirection,
    flexWrap: props.flexWrap,
    flex: props.flex,
    backgroundColor: props.backgroundColor,
    borderRadius: resolveToken(props.borderRadius),
    borderWidth: props.borderWidth,
    borderColor: props.borderColor,
    borderBottomWidth: props.borderBottomWidth,
    borderBottomColor: props.borderBottomColor,
    borderTopWidth: props.borderTopWidth,
    borderTopColor: props.borderTopColor,
    opacity: props.opacity,
    width: props.width,
    height: props.height,
    minWidth: props.minWidth,
    minHeight: props.minHeight,
    maxWidth: props.maxWidth,
    maxHeight: props.maxHeight,
    position: props.position,
    top: resolveToken(props.top),
    bottom: resolveToken(props.bottom),
    left: resolveToken(props.left),
    right: resolveToken(props.right),
    overflow: props.overflow,
    zIndex: props.zIndex,
  };
};

export const YStack = React.forwardRef<View, StackProps>((props, ref) => {
  const { style, ...rest } = props;
  const computedStyle = buildViewStyle(props);
  computedStyle.flexDirection = 'column';
  return <View ref={ref} style={[computedStyle, style]} {...rest} />;
});

export const XStack = React.forwardRef<View, StackProps>((props, ref) => {
  const { style, ...rest } = props;
  const computedStyle = buildViewStyle(props);
  computedStyle.flexDirection = 'row';
  return <View ref={ref} style={[computedStyle, style]} {...rest} />;
});

export interface TextPropsExt extends TextProps {
  color?: TextStyle['color'];
  fontSize?: number | string;
  fontWeight?: TextStyle['fontWeight'];
  fontFamily?: TextStyle['fontFamily'];
  textAlign?: TextStyle['textAlign'];
  textTransform?: TextStyle['textTransform'];
  letterSpacing?: TextStyle['letterSpacing'];
  lineHeight?: TextStyle['lineHeight'];
  opacity?: TextStyle['opacity'];
  children?: React.ReactNode;
}

export const Text = React.forwardRef<RNText, TextPropsExt>((props, ref) => {
  const { style, color, fontSize, fontWeight, fontFamily, textAlign, textTransform, letterSpacing, lineHeight, opacity, ...rest } = props;
  const computedStyle: TextStyle = {
    color,
    fontSize: resolveToken(fontSize) as number,
    fontWeight,
    fontFamily: fontFamily === '$mono' ? 'monospace' : fontFamily,
    textAlign,
    textTransform,
    letterSpacing,
    lineHeight,
    opacity,
  };
  return <RNText ref={ref} style={[computedStyle, style]} {...rest} />;
});

export interface ButtonProps extends StackProps, Omit<PressableProps, 'style'> {
  size?: string | number;
  pressStyle?: ViewStyle;
}

export const Button = React.forwardRef<View, ButtonProps>((props, ref) => {
  const { size, pressStyle, style, ...rest } = props;
  const baseStyle = buildViewStyle(props);
  baseStyle.justifyContent = 'center';
  baseStyle.alignItems = 'center';
  
  if (size === '$2') {
    baseStyle.paddingHorizontal = 12;
    baseStyle.height = 28;
  } else if (size === '$3') {
    baseStyle.paddingHorizontal = 16;
    baseStyle.height = 36;
  } else if (size === '$4') {
    baseStyle.paddingHorizontal = 20;
    baseStyle.height = 44;
  } else if (size === '$5') {
    baseStyle.paddingHorizontal = 24;
    baseStyle.height = 52;
  }

  return (
    <Pressable
      ref={ref}
      style={({ pressed }) => [
        baseStyle,
        style as ViewStyle,
        pressed && { opacity: 0.8 },
        pressed && pressStyle,
      ]}
      {...rest}
    />
  );
});

export const Switch = RNSwitch;
export type GetProps<T> = React.ComponentProps<T extends React.JSXElementConstructor<infer P> ? React.JSXElementConstructor<P> : any>;
export const Card = View;
export const styled = (component: any, config: any) => component;
