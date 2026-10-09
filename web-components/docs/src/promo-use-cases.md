<div class="gallery-content">
  <h1 id="promo-use-cases">Promotion and PZN Use Cases</h1>
  <p>These Nala cards request the SMB audience in en_US. Each example describes the expected promotion behavior.</p>
  <p><a target="_blank" rel="noopener noreferrer" href="https://mas.adobe.com/studio.html#page=promotions-editor&path=nala&promotionId=a7fa2f8d-88eb-41fc-93d2-16d7d2652ac9">Open NalaPromoPZNRules in Studio</a></p>
  <div class="three-merch-cards promo-use-cases">
    <section id="smb-excluded">
      <h2>1. SMB excluded from the project</h2>
      <p>This should display Photoshop SMB without the project's promo code or offer substitutions, even though the default fragment is included.</p>
      <merch-card variant="plans"><aem-fragment fragment="6908817e-8cfd-4f8b-9fc8-89f01da635fb" pzn="SMB"></aem-fragment></merch-card>
      <p><a target="_blank" rel="noopener noreferrer" href="https://mas.adobe.com/studio.html#fragmentId=6908817e-8cfd-4f8b-9fc8-89f01da635fb&page=fragment-editor&path=nala">Open in Studio</a></p>
    </section>
    <section id="smb-included">
      <h2>2. SMB included without a promo variation</h2>
      <p>This should display Illustrator SMB with the project's promo code or offer substitutions, preserving the SMB content.</p>
      <merch-card variant="plans"><aem-fragment fragment="a9fd0a11-a81d-4b4f-bfda-d77e393ce023" pzn="SMB"></aem-fragment></merch-card>
      <p><a target="_blank" rel="noopener noreferrer" href="https://mas.adobe.com/studio.html#fragmentId=a9fd0a11-a81d-4b4f-bfda-d77e393ce023&page=fragment-editor&path=nala">Open in Studio</a></p>
    </section>
    <section id="smb-promo">
      <h2>3. SMB included with a promo variation</h2>
      <p>This should display the Acrobat SMB promo variation with the project's promo code or offer substitutions, not the default fragment's promo variation.</p>
      <merch-card variant="plans"><aem-fragment fragment="a841a6df-c9b9-4cfc-b156-b4cee7b45f91" pzn="SMB"></aem-fragment></merch-card>
      <p><a target="_blank" rel="noopener noreferrer" href="https://mas.adobe.com/studio.html#fragmentId=a841a6df-c9b9-4cfc-b156-b4cee7b45f91&page=fragment-editor&path=nala">Open in Studio</a></p>
    </section>
  </div>
</div>
