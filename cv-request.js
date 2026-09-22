/* ============================================================
   CV request form
   Any element with the attribute data-cv-request opens this dialog.
   The request is emailed to Sajith through Web3Forms, and he replies
   with the CV himself. No CV file is ever public on the site.
   ============================================================ */
(function () {

  /* ---------------- ONE-TIME SETUP ----------------
     1. Go to https://web3forms.com
     2. Enter sajiths.pemarathna@gmail.com and create an access key
     3. Copy the key from the email they send and paste it below,
        replacing PASTE_YOUR_ACCESS_KEY_HERE (keep the quotes).
     Until you do this, the form still works: it opens the visitor's
     email app with the request already written out.
     -------------------------------------------------- */
  var WEB3FORMS_KEY = "PASTE_YOUR_ACCESS_KEY_HERE";
  var OWNER_EMAIL   = "sajiths.pemarathna@gmail.com";

  var CONFIGURED = WEB3FORMS_KEY.indexOf("PASTE_") !== 0;

  var markup =
    '<dialog class="cv-dialog" id="cv-dialog" aria-labelledby="cv-title">' +
      '<button type="button" class="cv-close" data-cv-close aria-label="Close">&times;</button>' +
      '<div class="cv-inner">' +

        '<div id="cv-form-view">' +
          '<h2 id="cv-title">Request my CV</h2>' +
          '<p class="cv-lead">Leave your details and I will email my CV to you directly, usually within one working day.</p>' +
          '<form id="cv-form" novalidate>' +
            '<div class="cv-field"><label for="cv-name">Name</label>' +
              '<input id="cv-name" name="name" type="text" autocomplete="name" required></div>' +
            '<div class="cv-field"><label for="cv-email">Email</label>' +
              '<input id="cv-email" name="email" type="email" autocomplete="email" required></div>' +
            '<div class="cv-field"><label for="cv-company">Company <small>(optional)</small></label>' +
              '<input id="cv-company" name="company" type="text" autocomplete="organization"></div>' +
            '<div class="cv-field"><label for="cv-role">Role you are hiring for <small>(optional)</small></label>' +
              '<input id="cv-role" name="role" type="text"></div>' +
            '<div class="cv-hp" aria-hidden="true"><label>Leave this empty ' +
              '<input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off"></label></div>' +
            '<p class="cv-note">Your details are used only to reply to this request and are not stored on this website.</p>' +
            '<div class="cv-actions"><button type="submit" class="btn btn-solid" id="cv-submit">Send request</button></div>' +
            '<p class="cv-status" id="cv-status" role="status" aria-live="polite"></p>' +
          '</form>' +
        '</div>' +

        '<div id="cv-done-view" hidden>' +
          '<h2>Request sent</h2>' +
          '<p class="cv-lead" id="cv-done-msg"></p>' +
          '<div class="cv-actions"><button type="button" class="btn btn-ghost" data-cv-close>Close</button></div>' +
        '</div>' +

      '</div>' +
    '</dialog>';

  document.body.insertAdjacentHTML("beforeend", markup);

  var dlg      = document.getElementById("cv-dialog");
  var form     = document.getElementById("cv-form");
  var formView = document.getElementById("cv-form-view");
  var doneView = document.getElementById("cv-done-view");
  var doneMsg  = document.getElementById("cv-done-msg");
  var statusEl = document.getElementById("cv-status");
  var submit   = document.getElementById("cv-submit");
  var sent     = false;

  var supportsDialog = typeof dlg.showModal === "function";

  function field(n) { return form.elements[n]; }

  function setStatus(text, isError, withEmailLink) {
    statusEl.textContent = text;
    statusEl.className = "cv-status" + (isError ? " err" : "");
    if (withEmailLink) {
      var a = document.createElement("a");
      a.href = "mailto:" + OWNER_EMAIL + "?subject=" + encodeURIComponent("CV request");
      a.textContent = OWNER_EMAIL;
      statusEl.appendChild(document.createTextNode(" "));
      statusEl.appendChild(a);
      statusEl.appendChild(document.createTextNode("."));
    }
  }

  function showDone(name, email, viaMailApp) {
    doneMsg.textContent = viaMailApp
      ? "Thank you, " + name + ". Your email app should now be open with the request written out. Send it and I will reply with my CV."
      : "Thank you, " + name + ". Your request has reached me, and I will send my CV to " + email + " shortly.";
    formView.hidden = true;
    doneView.hidden = false;
    sent = true;
  }

  function resetDialog() {
    form.reset();
    setStatus("", false);
    submit.disabled = false;
    submit.textContent = "Send request";
    formView.hidden = false;
    doneView.hidden = true;
    sent = false;
  }

  function openDialog() {
    if (sent) resetDialog();
    dlg.showModal();
    setTimeout(function () { field("name").focus(); }, 30);
  }

  // open from any Request CV link or button
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-cv-request]");
    if (!trigger || !supportsDialog) return;   // old browsers fall back to the mailto href
    e.preventDefault();
    openDialog();
  });

  // close button, close link, or a click on the dark backdrop
  dlg.addEventListener("click", function (e) {
    if (e.target === dlg || e.target.closest("[data-cv-close]")) dlg.close();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var name    = field("name").value.trim();
    var email   = field("email").value.trim();
    var company = field("company").value.trim();
    var role    = field("role").value.trim();

    if (!name) { setStatus("Please enter your name.", true); field("name").focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setStatus("Please enter a valid email address.", true); field("email").focus(); return;
    }

    // honeypot ticked means a bot: pretend it worked and send nothing
    if (field("botcheck").checked) { showDone(name, email, false); return; }

    var subject = "CV request from " + name + (company ? " (" + company + ")" : "");

    if (!CONFIGURED) {
      var body =
        "Hello Sajith,\n\nI would like to request your CV.\n\n" +
        "Name: " + name + "\nEmail: " + email +
        "\nCompany: " + (company || "-") + "\nRole: " + (role || "-") + "\n";
      window.location.href = "mailto:" + OWNER_EMAIL +
        "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      showDone(name, email, true);
      return;
    }

    submit.disabled = true;
    submit.textContent = "Sending…";
    setStatus("", false);

    fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: subject,
        from_name: "Portfolio CV request",
        replyto: email,
        name: name,
        email: email,
        company: company || "-",
        role: role || "-",
        sent_from_page: window.location.href
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.success) { showDone(name, email, false); }
        else { throw new Error("not accepted"); }
      })
      .catch(function () {
        submit.disabled = false;
        submit.textContent = "Send request";
        setStatus("Sorry, that did not go through. Please email me directly at", true, true);
      });
  });

})();
