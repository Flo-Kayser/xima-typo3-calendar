export type CategoryColors = Record<string, string>;

export const getCategoryColor = (categoryUid: number, overrides: CategoryColors = {}): string => {
    const override = overrides[String(categoryUid)];
    if (override) {
        return override;
    }

    const hue = Math.round((categoryUid * 137.508) % 360);
    return `hsl(${hue} 68% 46%)`;
};

export const getCategoryTextColor = (categoryUid: number, overrides: CategoryColors = {}): string => {
    const background = getCategoryColor(categoryUid, overrides);
    const rgb = parseColor(background);
    if (rgb === null) {
        return '#ffffff';
    }

    const luminance = getLuminance(rgb);
    const whiteContrast = (1 + 0.05) / (luminance + 0.05);
    const darkContrast = (luminance + 0.05) / 0.05;

    return whiteContrast >= darkContrast ? '#ffffff' : '#000000';
};

const parseColor = (color: string): [number, number, number] | null => {
    const hex = color.match(/^#([0-9a-f]{6})$/i);
    if (hex) {
        return [
            Number.parseInt(hex[1].slice(0, 2), 16),
            Number.parseInt(hex[1].slice(2, 4), 16),
            Number.parseInt(hex[1].slice(4, 6), 16),
        ];
    }

    const hsl = color.match(/^hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)$/i);
    if (!hsl) {
        return null;
    }

    const hue = (Number(hsl[1]) % 360) / 360;
    const saturation = Number(hsl[2]) / 100;
    const lightness = Number(hsl[3]) / 100;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const huePart = hue * 6;
    const x = chroma * (1 - Math.abs((huePart % 2) - 1));
    const match = huePart < 1
        ? [chroma, x, 0]
        : huePart < 2
            ? [x, chroma, 0]
            : huePart < 3
                ? [0, chroma, x]
                : huePart < 4
                    ? [0, x, chroma]
                    : huePart < 5
                        ? [x, 0, chroma]
                        : [chroma, 0, x];
    const lightnessAdjustment = lightness - chroma / 2;

    return match.map((value) => Math.round((value + lightnessAdjustment) * 255)) as [number, number, number];
};

const getLuminance = ([red, green, blue]: [number, number, number]): number => {
    const toLinear = (value: number): number => {
        const channel = value / 255;
        return channel <= 0.03928
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4;
    };

    return 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);
};
