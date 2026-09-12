export const staffColors = {
    mistySky: "#A9B7C6",
    midnightLagoon: "#2D3A47",
    background: "#F4F6F8",
    white: "#FFFFFF",
    text: "#2D3A47",
    muted: "#687582",
    lightText: "#DCE3E9",
    border: "#DCE3E9",
    hover: "#E8EDF1"
};

export const staffStyles = {
    page: {
        minHeight: "100vh",
        backgroundColor: staffColors.background
    },

    container: {
        padding: "32px 24px"
    },

    hero: {
        background: `linear-gradient(135deg, ${staffColors.midnightLagoon} 0%, #3E4D5D 100%)`,
        color: staffColors.white,
        borderRadius: "18px",
        padding: "32px",
        boxShadow: "0 10px 30px rgba(45,58,71,.15)"
    },

    logo: {
        width: "52px",
        height: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        backgroundColor: staffColors.mistySky,
        color: staffColors.midnightLagoon,
        fontSize: "22px",
        fontWeight: "700"
    },

    card: {
        backgroundColor: staffColors.white,
        border: "none",
        borderRadius: "16px",
        boxShadow: "0 6px 20px rgba(45,58,71,.08)",
        transition: "all .25s ease",
        cursor: "pointer"
    },

    cardHover: {
        transform: "translateY(-6px)",
        boxShadow: "0 14px 30px rgba(45,58,71,.15)"
    },

    iconBox: {
        width: "58px",
        height: "58px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "14px",
        backgroundColor: staffColors.mistySky,
        color: staffColors.midnightLagoon,
        fontSize: "23px",
        transition: "all .25s ease"
    },

    iconBoxHover: {
        transform: "scale(1.08) rotate(-3deg)",
        backgroundColor: staffColors.midnightLagoon,
        color: staffColors.mistySky
    },

    primaryButton: {
        backgroundColor: staffColors.midnightLagoon,
        border: `1px solid ${staffColors.midnightLagoon}`,
        color: staffColors.white,
        borderRadius: "10px",
        padding: "9px 18px",
        fontWeight: "600",
        transition: "all .2s ease"
    },

    primaryButtonHover: {
        backgroundColor: "#3E4D5D",
        transform: "translateY(-2px)",
        boxShadow: "0 6px 15px rgba(45,58,71,.2)"
    },

    secondaryButton: {
        backgroundColor: staffColors.mistySky,
        border: `1px solid ${staffColors.mistySky}`,
        color: staffColors.midnightLagoon,
        borderRadius: "10px",
        padding: "9px 18px",
        fontWeight: "600",
        transition: "all .2s ease"
    },

    dangerButton: {
        borderRadius: "10px",
        transition: "all .2s ease"
    },

    table: {
        backgroundColor: staffColors.white,
        borderRadius: "14px",
        overflow: "hidden"
    },

    tableHeader: {
        backgroundColor: staffColors.midnightLagoon,
        color: staffColors.white,
        border: "none"
    },

    badge: {
        display: "inline-block",
        backgroundColor: staffColors.mistySky,
        color: staffColors.midnightLagoon,
        borderRadius: "20px",
        padding: "6px 12px",
        fontWeight: "600",
        fontSize: "12px"
    },

    input: {
        borderRadius: "10px",
        border: `1px solid ${staffColors.border}`,
        transition: "all .2s ease"
    },

    sectionTitle: {
        color: staffColors.midnightLagoon,
        fontWeight: "700"
    },

    mutedText: {
        color: staffColors.muted
    },

    footer: {
        backgroundColor: staffColors.mistySky,
        color: staffColors.midnightLagoon,
        borderRadius: "16px",
        padding: "20px 24px"
    },

    infoBox: {
        backgroundColor: "#EEF2F5",
        borderRadius: "12px",
        padding: "16px",
        border: `1px solid ${staffColors.border}`
    },

    productImage: {
        width: "100%",
        height: "300px",
        objectFit: "contain",
        objectPosition: "center",
        backgroundColor: staffColors.white,
        transition: "transform .3s ease"
    },

    productImageHover: {
        transform: "scale(1.04)"
    }
};

export default staffStyles;