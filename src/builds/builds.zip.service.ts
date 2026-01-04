import { Injectable } from '@nestjs/common';
import ignore from 'ignore';
import JSZip from 'jszip';
import fs from "node:fs";
import path from 'node:path';

const dockerIgnorePath = `.dockerignore`;
const gitIgnorePath = `.gitignore`;

@Injectable()
export class BuildsZipService {

    async buildZip(fullPath: string, dockerfile?: string): Promise<Buffer> {
        const zip = new JSZip();
        const ig = ignore();

        try {
            if (fs.existsSync(fullPath + '/' + dockerIgnorePath)) {
                const content = fs.readFileSync(fullPath + '/' + dockerIgnorePath, 'utf8');
                ig.add(content);
            } else if (fs.existsSync(fullPath + '/' + gitIgnorePath)) {
                const content = fs.readFileSync(fullPath + '/' + gitIgnorePath, 'utf8');
                ig.add(content);
            }
        } catch (err) {
            console.warn("Failed to read ignore files", err);
        }

        ig.add(".git");
        ig.add("node_modules");

        let fileCount = 0;
        const addDirectoryToZip = async (directory: string, zipPath: string = "") => {
            const files = await fs.promises.readdir(directory);
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fullFilePath = path.join(directory, file);
                const stat = await fs.promises.stat(fullFilePath);

                const fullPathInZip = `${zipPath}/${file}`.replace(/^\//g, '');

                if (ig.ignores(fullPathInZip)) {
                    continue;
                }

                if (stat.isDirectory()) {
                    await addDirectoryToZip(fullFilePath, fullPathInZip);
                    continue;
                }

                zip.file(fullPathInZip, await fs.promises.readFile(fullFilePath));
                fileCount++;
            }
        }
        
        await addDirectoryToZip(fullPath);

        if (dockerfile) {
            zip.file('Dockerfile', fs.readFileSync(path.join(fullPath, dockerfile), 'utf8'));
            zip.remove(dockerfile);
        }

        if (fileCount === 0) {
            throw new Error("No files to upload (check your ignore rules)");
        }

        return await zip.generateAsync({ type: 'nodebuffer' });
    }


}
