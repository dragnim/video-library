<!-- Shown while a single record loads. Lists use Skeleton, which stands in for
     the shape of what is coming. -->
<div class="wrap">
  <div class="circle">
    <div class="ring"></div>
    <svg
      aria-hidden="true"
      class="logo"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 416 512"
    >
      <path
        fill="currentColor"
        d="M0 32v119h64V96h107c114 0 181 80 181 160 0 76-59 160-181 160H0v64h171c161 0 245-113 245-224 0-59-22-113-62-154-45-46-108-70-183-70H0z"
      />
    </svg>
  </div>
  <span class="sr-only" role="status">Loading</span>
</div>

<style>
  .wrap {
    display: flex;
    justify-content: center;
    padding: 6rem 0;
  }

  .circle {
    position: relative;
    width: 120px;
    height: 120px;
  }

  .ring {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    border: 12px solid var(--dyalog-video-library-rule);
    border-right-color: var(--dyalog-video-library-secondary);
    border-radius: 50%;
    animation: dyalog-video-library-spin 1.6s linear infinite;
  }

  /* Optically centred: the glyph's own left edge sits inside its viewBox. */
  .logo {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 50px;
    transform: translate(-46%, -50%);
    color: var(--dyalog-video-library-secondary);
  }

  @keyframes dyalog-video-library-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ring {
      animation-duration: 4.8s;
    }
  }
</style>
