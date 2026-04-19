const revealTargets = Array.from(document.querySelectorAll(".reveal"));

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 }
  );

  for (const element of revealTargets) {
    observer.observe(element);
  }
} else {
  for (const element of revealTargets) {
    element.classList.add("in");
  }
}
