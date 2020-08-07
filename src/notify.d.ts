import { WebhookPayload } from "discord-webhook-node";

declare module "discord-webhook-node" {
  export class MessageBuilder {
    constructor();

    getJSON(): WebhookPayload;
    setText(text: string): this;
    setAuthor(author?: string, authorImage?: string, authorUrl?: string): this;
    setTitle(title: string): this;
    setURL(url: string): this;
    setThumbnail(thumbnailUrl: string): this;
    setImage(image: string): this;
    setTimestamp(): this;
    setColor(color: number): this;
    setDescription(description: string): this;
    addField(fieldName: string, fieldValue: string, inline?: boolean): this;
    setFooter(footer: string, footerImage?: string): this;
  }
}
