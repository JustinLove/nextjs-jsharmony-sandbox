
import { Title } from '@tremor/react';
import Script from 'next/script'

export default async function TemplatePage() {
  return (
    <>
      <Script className="removeOnPublish" src="/jsHarmonyCmsEditor.js"/>
      <Script className="removeOnPublish" id="jsHarmonyCmsEditorScript">
      {'let tryLoad = function() {if (window.jsHarmonyCmsEditor) window.jsHarmonyCmsEditor({"access_keys":["fbdf1b857086c6250b1ade0f5c204c195ba89b708ce23ec713fed72d57d53f359d20930966001dabf3a891e31328b203"]}); else setTimeout(tryLoad, 10);}; tryLoad();'}
      </Script>
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <h1 cms-title="true">Title</h1>
        <div cms-content-editor="page.content.body">Body text</div>
      </main>
    </>
  );
}
