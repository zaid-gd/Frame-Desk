"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { makeFunctionReference } from "convex/server";
import type { ClientPortalAccess, ClientPortalPublicView } from "@/relay/domain/client-portal";
import { SafeMarkdown } from "@/relay/presentation/safe-markdown";
import styles from "./relay-client-portal.module.css";

type PublicResult = { access: Exclude<ClientPortalAccess, "open"> } | { access: "open"; view: ClientPortalPublicView };
type SharedFile = { id: string; title: string; fileName: string; mimeType: string; url: string; allowDownload: boolean; renderMode: "safe-markdown" | "plain-text" | "image" | "document" };
type FileResult = { access: Exclude<ClientPortalAccess, "open"> } | { access: "open"; files: SharedFile[] };
const portalFiles = makeFunctionReference<"query", { token: string; pin?: string; now: number }, FileResult>("relayProjectFiles:portalFiles");

const accessCopy: Record<Exclude<ClientPortalAccess, "open" | "pin-required" | "wrong-pin">, { title: string; body: string }> = {
  invalid: { title: "This link is not valid", body: "Ask your editor for a current Client Portal link." },
  closed: { title: "This portal is closed", body: "Your editor has paused public access. Contact them if you still need the project." },
  expired: { title: "This portal has expired", body: "Ask your editor to extend access or send a new link." },
};

export function RelayClientPortal({ token }: { token: string }) {
  const [pin, setPin] = useState("");
  const [submittedPin, setSubmittedPin] = useState<string>();
  const [displayName, setDisplayName] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const addComment = useMutation(api.relayClientPortals.addComment);
  const reopenComment = useMutation(api.relayClientPortals.reopenComment);
  const result: PublicResult | undefined = useQuery(api.relayClientPortals.publicView, submittedPin ? { token, pin: submittedPin } : { token });
  const fileResult = useQuery(portalFiles, submittedPin ? { token, pin: submittedPin, now } : { token, now });
  useEffect(() => { setDisplayName(localStorage.getItem("relay:client-display-name") ?? ""); const timer = window.setInterval(() => setNow(Date.now()), 60_000); return () => window.clearInterval(timer); }, []);
  if (!result) return <PortalState title="Loading portal" body="Checking this private Relay link…" />;
  if (result.access === "pin-required" || result.access === "wrong-pin") return <main className={styles.state}><section><RelayBrand /><h1>{result.access === "wrong-pin" ? "That PIN did not match" : "Enter the portal PIN"}</h1><p>Your editor protected this project with a PIN.</p><form onSubmit={(event) => { event.preventDefault(); setSubmittedPin(pin); }}><label htmlFor="portal-pin">PIN</label><input id="portal-pin" type="password" inputMode="numeric" autoComplete="one-time-code" minLength={4} maxLength={12} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} aria-invalid={result.access === "wrong-pin"} /><button type="submit" disabled={pin.length < 4}>Open portal</button></form></section></main>;
  if (result.access !== "open") return <PortalState {...accessCopy[result.access]} />;
  const { view } = result;
  return <main className={styles.portal}>
    <header><RelayBrand /><span>Private Client Portal</span></header>
    <section className={styles.hero}><p className={styles.eyebrow}>Project</p><h1>{view.project.name}</h1><div className={styles.progress}><span>{view.project.stage}</span><span>{view.project.progress}%</span></div><div role="progressbar" aria-label="Project progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={view.project.progress}><i style={{ width: `${Math.max(0, Math.min(100, view.project.progress))}%` }} /></div>{view.project.publicNotes ? <p>{view.project.publicNotes}</p> : null}<dl>{view.project.dueDate ? <div><dt>Due date</dt><dd>{view.project.dueDate}</dd></div> : null}{view.project.completedAt ? <div><dt>Completed</dt><dd>{new Date(view.project.completedAt).toLocaleDateString()}</dd></div> : null}</dl></section>
    <section className={styles.outputs}><div><p className={styles.eyebrow}>Shared work</p><h2>Current Project Outputs</h2></div>{view.outputs.length ? <ul>{view.outputs.map((output) => <li key={output.id}><div><h3>{output.name}</h3><span>{output.reviewState.replaceAll("_", " ")}</span></div><CurrentMedia output={output} /><section aria-label={`Comments for ${output.name}`}><h4>Comments</h4>{output.currentVersion.comments.length ? <ul>{output.currentVersion.comments.map((comment) => <li key={comment.id}><p><strong>{comment.authorName}</strong> · {comment.resolved ? "Resolved" : "Open"}</p><p>{comment.body}</p>{comment.resolved ? <button type="button" onClick={async () => { await reopenComment({ token, ...(submittedPin ? { pin: submittedPin } : {}), id: comment.id }); setNotice("Comment reopened."); }}>Reopen Comment from {comment.authorName}</button> : null}</li>)}</ul> : <p>No comments yet.</p>}<form onSubmit={async (event) => { event.preventDefault(); const cleanName = displayName.trim(); if (!cleanName) { setNotice("Enter your display name before commenting."); return; } localStorage.setItem("relay:client-display-name", cleanName); await addComment({ token, ...(submittedPin ? { pin: submittedPin } : {}), versionId: output.currentVersion.id, displayName: cleanName, body: commentBody }); setCommentBody(""); setNotice("Comment added."); }}><label>Display name<input value={displayName} maxLength={100} onChange={(event) => setDisplayName(event.target.value)} /></label><label>Comment<textarea value={commentBody} maxLength={2000} required onChange={(event) => setCommentBody(event.target.value)} /></label><button type="submit">Add Comment</button></form></section></li>)}</ul> : <p>No Project Outputs are shared yet.</p>}{notice ? <p role="status">{notice}</p> : null}</section>
    {fileResult?.access === "open" ? <section className={styles.outputs}><div><p className={styles.eyebrow}>Shared files</p><h2>Project files</h2></div>{fileResult.files.length ? <ul>{fileResult.files.map((file) => <li key={file.id}><SharedProjectFile file={file} /></li>)}</ul> : <p>No Project files are shared.</p>}</section> : null}
    <footer>Shared securely with Relay</footer>
  </main>;
}

function SharedProjectFile({ file }: { file: SharedFile }) {
  const [text, setText] = useState<string>();
  useEffect(() => {
    if (file.renderMode !== "safe-markdown" && file.renderMode !== "plain-text") return;
    let active = true;
    void fetch(file.url).then((response) => response.ok ? response.text() : Promise.reject(new Error("File unavailable"))).then((value) => { if (active) setText(value); }).catch(() => { if (active) setText("This file is unavailable."); });
    return () => { active = false; };
  }, [file.renderMode, file.url]);
  return <article><h3>{file.title}</h3>{file.renderMode === "image" ? <img src={file.url} alt={file.title} /> : file.renderMode === "document" ? <iframe title={file.title} src={file.url} /> : text === undefined ? <p role="status">Loading {file.fileName}…</p> : file.renderMode === "safe-markdown" ? <SafeMarkdown source={text} /> : <pre>{text}</pre>}{file.allowDownload ? <a href={file.url} download={file.fileName}>Download {file.fileName}</a> : <p>Download disabled by the Project owner.</p>}</article>;
}

function CurrentMedia({ output }: { output: ClientPortalPublicView["outputs"][number] }) {
  const { source } = output.currentVersion;
  if (source.provider === "youtube" && source.providerId) return <div className={styles.media}><iframe title={`${output.name} video`} src={`https://www.youtube-nocookie.com/embed/${source.providerId}`} allow="fullscreen; picture-in-picture" allowFullScreen /></div>;
  if (source.provider === "vimeo" && source.providerId) return <div className={styles.media}><iframe title={`${output.name} video`} src={`https://player.vimeo.com/video/${source.providerId}`} allow="fullscreen; picture-in-picture" allowFullScreen /></div>;
  return <a className={styles.mediaLink} href={source.url} target="_blank" rel="noreferrer">Open current version</a>;
}

function RelayBrand() { return <div className={styles.brand} aria-label="Relay"><i aria-hidden="true" /><strong>Relay</strong></div>; }
function PortalState({ title, body }: { title: string; body: string }) { return <main className={styles.state}><section><RelayBrand /><h1>{title}</h1><p>{body}</p></section></main>; }
