<script lang="ts">
  // A route rather than a panel in the footer.
  //
  // It was a button at the bottom of every page that expanded 150 lines of terms
  // in place. As a destination it can be linked to, bookmarked and read without
  // scrolling past the whole library, and the YouTube API terms it carries stay
  // reachable from every page through the strip above.
</script>

<svelte:head>
  <title>Terms of Use | Dyalog Video Library</title>
</svelte:head>

<section class="terms" aria-labelledby="video-library-terms">
  <h2 id="video-library-terms">Terms of Use</h2>

  <p>Last Updated: November 6, 2024</p>

  <ol>
    <li>
      <p>Acceptance of Terms</p>
      <p>
        By accessing or using the Dyalog video library (&quot;the
        Service&quot;), you (&quot;User&quot;) agree to be bound by these Terms
        of Use, as well as any applicable laws and regulations. If you do not
        agree with these Terms, you are prohibited from using the Service.
      </p>
    </li>
    <li>
      <p>Use of YouTube API Services</p>
      <p>
        The Service integrates with YouTube API Services to provide users access
        to video content hosted on YouTube.
      </p>
      <p>By using the Service, you acknowledge and agree that:</p>
      <ol class="alpha">
        <li>
          <p>
            YouTube Terms of Service: Your use of the YouTube API Services
            through this Service is governed by and subject to the
            <a href="https://www.youtube.com/t/terms"
              >YouTube Terms of Service</a
            >. You must comply with all applicable terms of use as outlined by
            YouTube when accessing their API or content.
          </p>
        </li>
        <li>
          <p>
            Google Privacy Policy: Your use of YouTube content through this
            Service is also governed by the
            <a href="http://www.google.com/policies/privacy"
              >Google Privacy Policy</a
            >.
          </p>
        </li>
      </ol>
    </li>
    <li>
      <p>User Data and Privacy</p>
      <p>
        While the Service itself does not collect or store any personal data
        from users, please be aware that:
      </p>
      <p>
        Third parties may collect and store data from or on users&apos; devices
        by placing, accessing or recognising cookies or similar technology on
        users&apos; devices or web browsers.
      </p>
      <p>
        The Service utilizes the YouTube API to display content, which may
        involve the collection of non-personally identifiable information as
        governed by YouTube’s and Google’s privacy policies.
      </p>
      <p>
        The Service does not share or collect personal data from users unless
        explicitly stated. Please review YouTube’s Privacy Policy and the Google
        Privacy Policy for more information on data collection and usage.
      </p>
    </li>
    <li>
      <p>Restrictions and Compliance</p>
      <p>You agree not to:</p>
      <ol class="alpha">
        <li>
          <p>
            Use the YouTube API Services in a way that violates YouTube’s Terms
            of Service or any applicable laws or regulations.
          </p>
        </li>
        <li>
          <p>
            Engage in any activity that may damage, disable, overburden, or
            impair the functionality of the Service or interfere with any other
            user’s ability to use the Service.
          </p>
        </li>
        <li>
          <p>
            Use the Service for any unlawful, harmful, or unauthorized purposes,
            including but not limited to distributing content that violates
            copyright laws or other intellectual property rights.
          </p>
        </li>
      </ol>
    </li>
    <li>
      <p>Changes to Terms</p>
      <p>
        We reserve the right to modify these Terms of Use at any time. Any
        changes to these Terms will be posted on this page and will take effect
        immediately upon posting. It is your responsibility to review these
        Terms periodically to stay informed of any changes. Your continued use
        of the Service after such modifications constitutes your acceptance of
        the updated Terms.
      </p>
    </li>
    <li>
      <p>Limitation of Liability</p>
      <p>
        The Service is provided &quot;as-is&quot; without any warranties,
        express or implied. We do not guarantee the availability, accuracy, or
        completeness of the YouTube content accessed through the Service, nor do
        we assume any responsibility for any issues arising from your use of the
        YouTube API Services.
      </p>
    </li>
    <li>
      <p>Termination</p>
      <p>
        We may suspend or terminate your access to the Service at our discretion
        if you violate these Terms of Use or any applicable laws.
      </p>
    </li>
    <li>
      <p>Governing Law</p>
      <p>
        These Terms are governed by the laws of England and Wales without regard
        to its conflict of law principles.
      </p>
    </li>
  </ol>
</section>

<style>
  .terms {
    padding: 1.25rem 0;
  }

  :global(#dyalog-video-library) .terms h2 {
    font-size: var(--dyalog-video-library-size-xl);
    font-weight: var(--dyalog-video-library-weight-regular);
    margin-bottom: 0.75rem;
  }

  /*
   * Everything below carries the mount id.
   *
   * app.css zeroes the margin on p, ol and ul inside the mount at the id's
   * 1,0,0, so a scoped rule here at 0,1,1 loses to it and does nothing at all —
   * which is why this page had no paragraph spacing.
   */
  :global(#dyalog-video-library) .terms p {
    margin-bottom: 0.75rem;
  }

  /* The gap after a section is the list item's, not its last line's. */
  :global(#dyalog-video-library) .terms li > p:last-child {
    margin-bottom: 0;
  }

  /*
   * The numbered sections' own titles, and only those.
   *
   * In the lettered lists the title and its text share one paragraph — "YouTube
   * Terms of Service: Your use of…" — so the same rule there would embolden the
   * whole clause.
   */
  :global(#dyalog-video-library) .terms > ol > li > p:first-child {
    font-weight: var(--dyalog-video-library-weight-bold);
  }

  :global(#dyalog-video-library) .terms > ol > li {
    margin-bottom: 1.5rem;
  }

  :global(#dyalog-video-library) .terms ol.alpha > li {
    margin-bottom: 0.75rem;
  }

  :global(#dyalog-video-library) .terms ol {
    padding-left: 1.25rem;
    list-style: decimal;
  }

  :global(#dyalog-video-library) .terms ol.alpha {
    margin-top: 0.75rem;
    padding-left: 2.5rem;
    list-style: lower-alpha;
  }
</style>
