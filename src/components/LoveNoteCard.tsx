import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

interface LoveNoteCardProps {
    note: string;
    onDismiss: () => void;
}

export default function LoveNoteCard({ note, onDismiss }: LoveNoteCardProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        // Fade in + scale animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto-dismiss after 8 seconds
        const timer = setTimeout(() => {
            onDismiss();
        }, 8000);

        return () => clearTimeout(timer);
    }, [fadeAnim, scaleAnim, onDismiss]);

    return (
        <Animated.View
            style={[
                styles.overlay,
                {
                    opacity: fadeAnim,
                },
            ]}
        >
            <Animated.View
                style={[
                    styles.card,
                    {
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <Text style={styles.heartIcon}>💗</Text>
                <Text style={styles.noteText}>{note}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
                    <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        maxWidth: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    heartIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    noteText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2D2D2D',
        textAlign: 'center',
        lineHeight: 28,
        marginBottom: 24,
    },
    closeButton: {
        backgroundColor: '#E63946',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 999,
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
