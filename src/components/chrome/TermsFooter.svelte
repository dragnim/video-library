<script lang="ts">
  // dvl used an <a href="#"> with preventDefault. It toggles a panel rather
  // than going anywhere, so it is a button.
  let expanded = $state(false);
</script>

<div class="terms">
  <button
    type="button"
    class="toggle"
    aria-expanded={expanded}
    onclick={() => (expanded = !expanded)}
  >
    {expanded ? "Hide Terms of Use" : "Terms of Use"}
  </button>

  {#if expanded}
    <div class="body">
      <h3>Terms of Use</h3>

      <p>Last Updated: November 6, 2024</p>

      <ol>
        <li>
          <p>Acceptance of Terms</p>
          <p>
            By accessing or using the Dyalog video library (&quot;the
            Service&quot;), you (&quot;User&quot;) agree to be bound by these
            Terms of Use, as well as any applicable laws and regulations. If you
            do not agree with these Terms, you are prohibited from using the
            Service.
          </p>
        </li>
        <li>
          <p>Use of YouTube API Services</p>
          <p>
            The Service integrates with YouTube API Services to provide users
            access to video content hosted on YouTube.
          </p>
          <p>By using the Service, you acknowledge and agree that:</p>
          <ol class="alpha">
            <li>
              <p>
                YouTube Terms of Service: Your use of the YouTube API Services
                through this Service is governed by and subject to the
                <a href="https://www.youtube.com/t/terms"
                  >YouTube Terms of Service</a
                >. You must comply with all applicable terms of use as outlined
                by YouTube when accessing their API or content.
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
            Third parties may collect and store data from or on users&apos;
            devices by placing, accessing or recognising cookies or similar
            technology on users&apos; devices or web browsers.
          </p>
          <p>
            The Service utilizes the YouTube API to display content, which may
            involve the collection of non-personally identifiable information as
            governed by YouTube’s and Google’s privacy policies.
          </p>
          <p>
            The Service does not share or collect personal data from users
            unless explicitly stated. Please review YouTube’s Privacy Policy and
            the Google Privacy Policy for more information on data collection
            and usage.
          </p>
        </li>
        <li>
          <p>Restrictions and Compliance</p>
          <p>You agree not to:</p>
          <ol class="alpha">
            <li>
              <p>
                Use the YouTube API Services in a way that violates YouTube’s
                Terms of Service or any applicable laws or regulations.
              </p>
            </li>
            <li>
              <p>
                Engage in any activity that may damage, disable, overburden, or
                impair the functionality of the Service or interfere with any
                other user’s ability to use the Service.
              </p>
            </li>
            <li>
              <p>
                Use the Service for any unlawful, harmful, or unauthorized
                purposes, including but not limited to distributing content that
                violates copyright laws or other intellectual property rights.
              </p>
            </li>
          </ol>
        </li>
        <li>
          <p>Changes to Terms</p>
          <p>
            We reserve the right to modify these Terms of Use at any time. Any
            changes to these Terms will be posted on this page and will take
            effect immediately upon posting. It is your responsibility to review
            these Terms periodically to stay informed of any changes. Your
            continued use of the Service after such modifications constitutes
            your acceptance of the updated Terms.
          </p>
        </li>
        <li>
          <p>Limitation of Liability</p>
          <p>
            The Service is provided &quot;as-is&quot; without any warranties,
            express or implied. We do not guarantee the availability, accuracy,
            or completeness of the YouTube content accessed through the Service,
            nor do we assume any responsibility for any issues arising from your
            use of the YouTube API Services.
          </p>
        </li>
        <li>
          <p>Termination</p>
          <p>
            We may suspend or terminate your access to the Service at our
            discretion if you violate these Terms of Use or any applicable laws.
          </p>
        </li>
        <li>
          <p>Governing Law</p>
          <p>
            These Terms are governed by the laws of England and Wales without
            regard to its conflict of law principles.
          </p>
        </li>
      </ol>
    </div>
  {/if}
</div>

<style>
  .terms {
    padding: 1.25rem;
  }

  .toggle {
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    color: var(--dyalog-video-library-link);
    cursor: pointer;
  }

  .toggle:hover {
    text-decoration: underline;
  }

  ol {
    padding-left: 1.25rem;
    list-style: decimal;
  }

  ol.alpha {
    padding-left: 2.5rem;
    list-style: lower-alpha;
  }
</style>
