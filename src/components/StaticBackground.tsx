import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

interface StaticBackgroundProps {
  source: any;
  overlayColor?: string;
  children?: React.ReactNode;
}

export const StaticBackground: React.FC<StaticBackgroundProps> = ({ 
  source, 
  overlayColor = 'rgba(15, 23, 42, 0.7)',
  children 
}) => {
  return (
    <View style={styles.container}>
      <Image 
        source={source} 
        style={styles.image} 
        resizeMode="cover"
      />
      <View style={[StyleSheet.absoluteFill as any, { backgroundColor: overlayColor }]} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
});
