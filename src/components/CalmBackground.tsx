import React, { useState, useEffect } from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import PremiumCalmBackground from './PremiumCalmBackground';

export default function CalmBackground({ enabled }: { enabled: boolean }) {
    // We can keep the reduce motion check here if we want to return null early,
    // but PremiumCalmBackground handles it internal logic too (returning static).
    // However, the spec said: "render either null OR a static gradient".
    // PremiumCalmBackground handles static gradient when reduceMotion is true.
    // So we just pass enabled.

    return <PremiumCalmBackground enabled={enabled} />;
}

const styles = StyleSheet.create({
    // Styles were moved to PremiumCalmBackground or unused
});

