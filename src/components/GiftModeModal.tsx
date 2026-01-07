import { useEffect, useRef } from 'react';
import {
    Animated,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface GiftModeModalProps {
    visible: boolean;
    onDismiss: () => void;
}

export default function GiftModeModal({ visible, onDismiss }: GiftModeModalProps) {
    // Animated heart positions
    const heart1Y = useRef(new Animated.Value(0)).current;
    const heart2Y = useRef(new Animated.Value(0)).current;
    const heart3Y = useRef(new Animated.Value(0)).current;

    const heart1Opacity = useRef(new Animated.Value(0)).current;
    const heart2Opacity = useRef(new Animated.Value(0)).current;
    const heart3Opacity = useRef(new Animated.Value(0)).current;

    const titleScale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        if (!visible) return;

        // Title entrance
        Animated.spring(titleScale, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
        }).start();

        // Floating hearts animation (loop)
        const createHeartAnimation = (
            yValue: Animated.Value,
            opacityValue: Animated.Value,
            delay: number
        ) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.parallel([
                        Animated.timing(yValue, {
                            toValue: -200,
                            duration: 3000,
                            useNativeDriver: true,
                        }),
                        Animated.sequence([
                            Animated.timing(opacityValue, {
                                toValue: 1,
                                duration: 500,
                                useNativeDriver: true,
                            }),
                            Animated.delay(2000),
                            Animated.timing(opacityValue, {
                                toValue: 0,
                                duration: 500,
                                useNativeDriver: true,
                            }),
                        ]),
                    ]),
                    Animated.timing(yValue, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        const anim1 = createHeartAnimation(heart1Y, heart1Opacity, 0);
        const anim2 = createHeartAnimation(heart2Y, heart2Opacity, 1000);
        const anim3 = createHeartAnimation(heart3Y, heart3Opacity, 2000);

        anim1.start();
        anim2.start();
        anim3.start();

        return () => {
            anim1.stop();
            anim2.stop();
            anim3.stop();
        };
    }, [visible, heart1Y, heart2Y, heart3Y, heart1Opacity, heart2Opacity, heart3Opacity, titleScale]);

    return (
        <Modal visible={visible} animationType="fade" transparent={false}>
            <View style={styles.container}>
                {/* Floating hearts */}
                <Animated.Text
                    style={[
                        styles.floatingHeart,
                        styles.heart1,
                        {
                            transform: [{ translateY: heart1Y }],
                            opacity: heart1Opacity,
                        },
                    ]}
                >
                    💗
                </Animated.Text>

                <Animated.Text
                    style={[
                        styles.floatingHeart,
                        styles.heart2,
                        {
                            transform: [{ translateY: heart2Y }],
                            opacity: heart2Opacity,
                        },
                    ]}
                >
                    💘
                </Animated.Text>

                <Animated.Text
                    style={[
                        styles.floatingHeart,
                        styles.heart3,
                        {
                            transform: [{ translateY: heart3Y }],
                            opacity: heart3Opacity,
                        },
                    ]}
                >
                    💕
                </Animated.Text>

                {/* Content */}
                <View style={styles.content}>
                    <Animated.View style={{ transform: [{ scale: titleScale }] }}>
                        <Text style={styles.title}>made with love 💘</Text>
                        <Text style={styles.subtitle}>for Bengisu</Text>
                        <Text style={styles.fromText}>from someone who believes in you</Text>
                    </Animated.View>

                    <Pressable style={styles.button} onPress={onDismiss}>
                        <Text style={styles.buttonText}>Let's start</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF8F0',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    floatingHeart: {
        position: 'absolute',
        fontSize: 48,
    },
    heart1: {
        left: '20%',
        bottom: 100,
    },
    heart2: {
        left: '50%',
        bottom: 150,
    },
    heart3: {
        left: '75%',
        bottom: 80,
    },
    content: {
        alignItems: 'center',
        padding: 32,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: '#E63946',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#D4A5D9',
        textAlign: 'center',
        marginBottom: 8,
    },
    fromText: {
        fontSize: 14,
        fontWeight: '400',
        color: '#6B6B6B',
        textAlign: 'center',
        marginBottom: 48,
        fontStyle: 'italic',
    },
    button: {
        backgroundColor: '#E63946',
        paddingHorizontal: 48,
        paddingVertical: 16,
        borderRadius: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '600',
    },
});
