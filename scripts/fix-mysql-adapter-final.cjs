const fs = require("fs");
const content = fs.readFileSync("server/db/mysql-adapter.ts", "utf8");
const lines = content.split("\n");

// Find the class closing brace
let classDepth = 0;
let classEnd = -1;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const openBraces = (line.match(/{/g) || []).length;
  const closeBraces = (line.match(/}/g) || []).length;
  classDepth += openBraces - closeBraces;
  if (classDepth === 0 && i > 0) {
    classEnd = i;
  }
}
console.log("Class ends at line:", classEnd + 1);

const classEndIndex = 653; // line 654 (0-indexed 653)
const beforeClassEnd = lines.slice(0, 653);
const afterClassEnd = lines.slice(654);

const newMethodsText = `
  // Comments
  async deleteComment(id: string): Promise<boolean> {
    const { error } = await this.from("comments").delete().eq("id", id);
    return !error;
  }

  // Newsletter
  async getNewsletterSubscribers(options?: { status?: string; limit?: number; offset?: number }): Promise<any[]> {
    let builder = this.from("newsletter_subscribers").select("*");
    if (options?.status) builder = builder.eq("status", options.status);
    builder = builder.order("created_at", { ascending: false });
    if (options?.limit) builder = builder.limit(options.limit);
    if (options?.offset) builder = builder.range(options.offset, options.offset + (options.limit || 20) - 1);
    const { data } = await builder;
    return this.mapRows<any>(data || []);
  }

  async deleteSubscriber(id: string): Promise<boolean> {
    const { error } = await this.from("newsletter_subscribers").delete().eq("id", id);
    return !error;
  }

  async getSubscribersDueForDrip(): Promise<any[]> {
    const { data } = await this.from("newsletter_subscribers").select("*").eq("status", "active");
    return this.mapRows<any>(data || []);
  }

  async updateSubscriberDripProgress(id: string, progress: any): Promise<any> {
    const { data } = await this.from("newsletter_subscribers").update({ drip_progress: progress }).eq("id", id).select().single();
    return data;
  }

  // Messages
  async getMessages(options?: { status?: string; limit?: number; offset?: number }): Promise<any[]> {
    let builder = this.from("messages").select("*");
    if (options?.status) builder = builder.eq("status", options.status);
    builder = builder.order("created_at", { ascending: false });
    if (options?.limit) builder = builder.limit(options.limit);
    if (options?.offset) builder = builder.range(options.offset, options.offset + (options.limit || 20) - 1);
    const { data } = await builder;
    return this.mapRows<any>(data || []);
  }

  async markMessageRead(id: string): Promise<any> {
    const { data } = await this.from("messages").update({ status: "read" }).eq("id", id).select().single();
    return data;
  }

  // Media
  async getMedia(options?: { limit?: number; offset?: number }): Promise<any[]> {
    let builder = this.from("media").select("*").order("created_at", { ascending: false });
    if (options?.limit) builder = builder.limit(options.limit);
    if (options?.offset) builder = builder.range(options.offset, options.offset + (options.limit || 20) - 1);
    const { data } = await builder;
    return this.mapRows<any>(data || []);
  }

  async uploadMedia(data: any): Promise<any> {
    const { data: created } = await this.from("media").insert({ id: crypto.randomUUID(), ...data }).select().single();
    return created;
  }

  async deleteMedia(id: string): Promise<boolean> {
    const { error } = await this.from("media").delete().eq("id", id);
    return !error;
  }

  // Users
  async createUser(data: any): Promise<any> {
    const { data: created } = await this.from("users").insert({ id: crypto.randomUUID(), ...data }).select().single();
    return created;
  }

  async updateUser(id: string, updates: any): Promise<any> {
    const { data } = await this.from("users").update(updates).eq("id", id).select().single();
    return data;
  }

  // Logs
  async getLogs(options?: { level?: string; limit?: number; offset?: number }): Promise<any[]> {
    let builder = this.from("activity_logs").select("*").order("created_at", { ascending: false });
    if (options?.level) builder = builder.eq("level", options.level);
    if (options?.limit) builder = builder.limit(options.limit);
    if (options?.offset) builder = builder.range(options.offset, options.offset + (options.limit || 50) - 1);
    const { data } = await builder;
    return this.mapRows<any>(data || []);
  }

  // Comments
  async deleteComment(id: string): Promise<boolean> {
    const { error } = await this.from("comments").delete().eq("id", id);
    return !error;
  }
`;

const beforeClassEnd = lines.slice(0, 653);
const afterClassEnd = lines.slice(654);

const newLines = beforeClassEnd.concat(newMethodsText.split("\n")).concat(["  }"]).concat(afterClassEnd.slice(1));

fs.writeFileSync("server/db/mysql-adapter.ts", newLines.join("\n"));
console.log("Fixed");