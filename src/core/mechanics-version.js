// Missing version preserves historical action replay; accepted future actions opt in.
export const usesCurrentMechanics=state=>state?.mechanicsVersion===1;
