"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { ClientPortalAccess, ClientPortalPublicView } from "@/relay/domain/client-portal";
import styles from "./relay-client-portal.module.css";

type PublicResult = { access: Exclude<ClientPortalAccess, "open"> } | { access: "open"; view: ClientPortalPublicView };

const accessCopy: Record<Exclude<ClientPortalAccess, "open" | "pin-required" | "wrong-pin">, { title: string; body: string }> = {
  invalid: { title: "This link is not valid", body: "Ask your editor for a current Client Portal link." },
  closed: { title: "This portal is closed", body: "Your editor has paused public access. Contact them if you still need the project." },
  expired: { title: "This portal has expired", body: "Ask your editor to extend access or send a new link." },
};

export function RelayClientPortal({ token }: { token: string }) {
  const [pin, setPin] = useState("");
  const [submittedPin, setSubmittedPin] = useState<string>();
  const result: PublicResult | undefined = useQuery(api.relayClientPortals.publicView, submittedPin ? { token, pin: submittedPin } : { token });
  if (!result) return <PortalState title="Loading portal" body="Checking this private Relay link…" />;
  if (result.access === "pin-required" || result.access === "wrong-pin") return <main className={styles.state}><section><RelayBrand /><h1>{result.access === "wrong-pin" ? "That PIN did not match" : "Enter the portal PIN"}</h1><p>Your editor protected this project with a PIN.</p><form onSubmit={(event) => { event.preventDefault(); setSubmittedPin(pin); }}><label htmlFor="portal-pin">PIN</label><input id="portal-pin" type="password" inputMode="numeric" autoComplete="one-time-code" minLength={4} maxLength={12} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))} aria-invalid={result.access === "wrong-pin"} /><button type="submit" disabled={pin.length < 4}>Open portal</button></form></section></main>;
  if (result.access !== "open") return <PortalState {...accessCopy[result.access]} />;
  const { view } = result;
  return <main className={styles.portal}>
    <header><RelayBrand /><span>Private Client Portal</span></header>
    <section className={styles.hero}><p className={styles.eyebrow}>Project</p><h1>{view.project.name}</h1><div className={styles.progress}><span>{view.project.stage}</span><span>{view.project.progress}%</span></div><div role="progressbar" aria-label="Project progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={view.project.progress}><i style={{ width: `${Math.max(0, Math.min(100, view.project.progress))}%` }} /></div>{view.project.publicNotes ? <p>{view.project.publicNotes}</p> : null}<dl>{view.project.dueDate ? <div><dt>Due date</dt><dd>{view.project.dueDate}</dd></div> : null}{view.project.completedAt ? <div><dt>Completed</dt><dd>{new Date(view.project.completedAt).toLocaleDateString()}</dd></div> : null}</dl></section>
    <section className={styles.outputs}><div><p className={styles.eyebrow}>Shared work</p><h2>Current Project Outputs</h2></div>{view.outputs.length ? <ul>{view.outputs.map((output) => <li key={output.id}><div><h3>{output.name}</h3><span>{output.reviewState.replaceAll("_", " ")}</span></div><CurrentMedia output={output} /></li>)}</ul> : <p>No Project Outputs are shared yet.</p>}</section>
    <footer>Shared securely with Relay</footer>
  </main>;
}

function CurrentMedia({ output }: { output: ClientPortalPublicView["outputs"][number] }) {
  const { source } = output.currentVersion;
  if (source.provider === "youtube" && source.providerId) return <div className={styles.media}><iframe title={`${output.name} video`} src={`https://www.youtube-nocookie.com/embed/${source.providerId}`} allow="fullscreen; picture-in-picture" allowFullScreen /></div>;
  if (source.provider === "vimeo" && source.providerId) return <div className={styles.media}><iframe title={`${output.name} video`} src={`https://player.vimeo.com/video/${source.providerId}`} allow="fullscreen; picture-in-picture" allowFullScreen /></div>;
  return <a className={styles.mediaLink} href={source.url} target="_blank" rel="noreferrer">Open current version</a>;
}

function RelayBrand() { return <div className={styles.brand} aria-label="Relay"><i aria-hidden="true" /><strong>Relay</strong></div>; }
function PortalState({ title, body }: { title: string; body: string }) { return <main className={styles.state}><section><RelayBrand /><h1>{title}</h1><p>{body}</p></section></main>; }
