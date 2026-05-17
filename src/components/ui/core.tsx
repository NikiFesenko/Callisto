import React from 'react';

const resolveToken = (val: any) => {
  if (typeof val === 'string' && val.startsWith('$')) {
    const num = parseFloat(val.slice(1));
    return num * 4; // $1 = 4px, $4 = 16px, etc.
  }
  return val;
};

export const YStack = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  const { style, gap, padding, paddingHorizontal, paddingVertical, paddingTop, paddingBottom, paddingLeft, paddingRight, margin, marginTop, marginBottom, marginLeft, marginRight, alignItems, justifyContent, flex, backgroundColor, borderRadius, borderWidth, borderColor, width, height, position, top, bottom, left, right, overflow, zIndex, children, ...rest } = props;
  const computedStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: resolveToken(gap),
    padding: padding ? resolveToken(padding) : undefined,
    paddingLeft: paddingHorizontal ? resolveToken(paddingHorizontal) : (paddingLeft ? resolveToken(paddingLeft) : undefined),
    paddingRight: paddingHorizontal ? resolveToken(paddingHorizontal) : (paddingRight ? resolveToken(paddingRight) : undefined),
    paddingTop: paddingVertical ? resolveToken(paddingVertical) : (paddingTop ? resolveToken(paddingTop) : undefined),
    paddingBottom: paddingVertical ? resolveToken(paddingVertical) : (paddingBottom ? resolveToken(paddingBottom) : undefined),
    margin: margin ? resolveToken(margin) : undefined,
    marginTop: marginTop ? resolveToken(marginTop) : undefined,
    marginBottom: marginBottom ? resolveToken(marginBottom) : undefined,
    marginLeft: marginLeft ? resolveToken(marginLeft) : undefined,
    marginRight: marginRight ? resolveToken(marginRight) : undefined,
    alignItems,
    justifyContent,
    flex,
    backgroundColor,
    borderRadius: borderRadius ? resolveToken(borderRadius) : undefined,
    borderWidth,
    borderColor,
    borderStyle: borderWidth ? 'solid' : undefined,
    width,
    height,
    position,
    top: top ? resolveToken(top) : undefined,
    bottom: bottom ? resolveToken(bottom) : undefined,
    left: left ? resolveToken(left) : undefined,
    right: right ? resolveToken(right) : undefined,
    overflow,
    zIndex,
    boxSizing: 'border-box',
    ...style,
  };
  return <div ref={ref} style={computedStyle} {...rest}>{children}</div>;
});

export const XStack = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  const { style, gap, padding, paddingHorizontal, paddingVertical, paddingTop, paddingBottom, paddingLeft, paddingRight, margin, marginTop, marginBottom, marginLeft, marginRight, alignItems, justifyContent, flexWrap, flex, backgroundColor, borderRadius, borderWidth, borderColor, width, height, position, top, bottom, left, right, overflow, zIndex, children, ...rest } = props;
  const computedStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap,
    gap: resolveToken(gap),
    padding: padding ? resolveToken(padding) : undefined,
    paddingLeft: paddingHorizontal ? resolveToken(paddingHorizontal) : (paddingLeft ? resolveToken(paddingLeft) : undefined),
    paddingRight: paddingHorizontal ? resolveToken(paddingHorizontal) : (paddingRight ? resolveToken(paddingRight) : undefined),
    paddingTop: paddingVertical ? resolveToken(paddingVertical) : (paddingTop ? resolveToken(paddingTop) : undefined),
    paddingBottom: paddingVertical ? resolveToken(paddingVertical) : (paddingBottom ? resolveToken(paddingBottom) : undefined),
    margin: margin ? resolveToken(margin) : undefined,
    marginTop: marginTop ? resolveToken(marginTop) : undefined,
    marginBottom: marginBottom ? resolveToken(marginBottom) : undefined,
    marginLeft: marginLeft ? resolveToken(marginLeft) : undefined,
    marginRight: marginRight ? resolveToken(marginRight) : undefined,
    alignItems,
    justifyContent,
    flex,
    backgroundColor,
    borderRadius: borderRadius ? resolveToken(borderRadius) : undefined,
    borderWidth,
    borderColor,
    borderStyle: borderWidth ? 'solid' : undefined,
    width,
    height,
    position,
    top: top ? resolveToken(top) : undefined,
    bottom: bottom ? resolveToken(bottom) : undefined,
    left: left ? resolveToken(left) : undefined,
    right: right ? resolveToken(right) : undefined,
    overflow,
    zIndex,
    boxSizing: 'border-box',
    ...style,
  };
  return <div ref={ref} style={computedStyle} {...rest}>{children}</div>;
});

export const Text = React.forwardRef<HTMLSpanElement, any>((props, ref) => {
  const { style, color, fontSize, fontWeight, fontFamily, textAlign, letterSpacing, lineHeight, numberOfLines, children, ...rest } = props;
  const computedStyle: React.CSSProperties = {
    color,
    fontSize: resolveToken(fontSize),
    fontWeight,
    fontFamily: fontFamily === '$mono' ? 'monospace' : fontFamily,
    textAlign,
    letterSpacing,
    lineHeight,
    overflow: numberOfLines ? 'hidden' : undefined,
    textOverflow: numberOfLines ? 'ellipsis' : undefined,
    display: numberOfLines ? '-webkit-box' : undefined,
    WebkitLineClamp: numberOfLines,
    WebkitBoxOrient: numberOfLines ? 'vertical' : undefined,
    ...style,
  };
  return <span ref={ref} style={computedStyle} {...rest}>{children}</span>;
});

export const Button = React.forwardRef<HTMLButtonElement, any>((props, ref) => {
  const { size, pressStyle, style, backgroundColor, borderRadius, paddingHorizontal, paddingVertical, borderWidth, borderColor, marginTop, children, onPress, ...rest } = props;
  const computedStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.15s ease',
    backgroundColor: backgroundColor || 'transparent',
    borderRadius: borderRadius ? resolveToken(borderRadius) : undefined,
    paddingLeft: paddingHorizontal ? resolveToken(paddingHorizontal) : undefined,
    paddingRight: paddingHorizontal ? resolveToken(paddingHorizontal) : undefined,
    paddingTop: paddingVertical ? resolveToken(paddingVertical) : undefined,
    paddingBottom: paddingVertical ? resolveToken(paddingVertical) : undefined,
    borderWidth,
    borderColor,
    borderStyle: borderWidth ? 'solid' : undefined,
    marginTop: marginTop ? resolveToken(marginTop) : undefined,
    ...style,
  };
  
  if (size === '$2') {
    computedStyle.padding = '0 12px';
    computedStyle.height = 28;
  } else if (size === '$3') {
    computedStyle.padding = '0 16px';
    computedStyle.height = 36;
  }

  return (
    <button ref={ref} style={computedStyle} onClick={onPress} {...rest}>{children}</button>
  );
});

export const Input = React.forwardRef<HTMLInputElement, any>((props, ref) => {
  const { style, backgroundColor, color, borderRadius, borderWidth, borderColor, padding, ...rest } = props;
  const computedStyle: React.CSSProperties = {
    backgroundColor,
    color,
    borderRadius: borderRadius ? resolveToken(borderRadius) : 8,
    borderWidth: borderWidth || 1,
    borderColor: borderColor || 'rgba(255,255,255,0.1)',
    borderStyle: 'solid',
    padding: padding ? resolveToken(padding) : '8px 12px',
    outline: 'none',
    ...style,
  };
  return <input ref={ref} style={computedStyle} {...rest} />;
});

export const Card = (props: any) => <div {...props} />;
export const Spinner = () => <div style={{ width: 16, height: 16, borderRadius: 8, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#FFF', animation: 'spin 1s linear infinite' }}><style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style></div>;
export const Switch = React.forwardRef<HTMLInputElement, any>((props, ref) => {
  const { value, onValueChange, trackColor, thumbColor, ...rest } = props;
  
  const isChecked = value === true;
  const activeColor = trackColor?.true || '#10B981';
  const inactiveColor = trackColor?.false || 'rgba(255,255,255,0.1)';
  const tColor = thumbColor || '#FFF';

  return (
    <div 
      onClick={() => onValueChange && onValueChange(!isChecked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: isChecked ? activeColor : inactiveColor,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 2,
        left: isChecked ? 22 : 2,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: tColor,
        transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }} />
      <input 
        type="checkbox" 
        checked={isChecked} 
        onChange={(e) => onValueChange && onValueChange(e.target.checked)}
        style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer', margin: 0, top: 0, left: 0 }}
        ref={ref}
        {...rest} 
      />
    </div>
  );
});
