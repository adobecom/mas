// Force reload environment variables by clearing existing ones first
import { load } from 'jsr:@std/dotenv';

export async function reloadEnv() {
    const envPath = '../../.env';
    try {
        // Read the .env file content directly
        const envContent = await Deno.readTextFile(envPath);
        const envLines = envContent.split('\n').filter((line) => line.trim() && !line.startsWith('#'));

        // Clear existing environment variables that are defined in .env
        for (const line of envLines) {
            const [key] = line.split('=');
            if (key) {
                Deno.env.delete(key.trim());
            }
        }

        // Now load fresh from .env file
        await load({ envPath, export: true, override: true });
        console.log('Environment variables reloaded successfully');
    } catch (error) {
        console.error('Error reloading environment variables:', error);
        // Fallback to regular load
        await load({ envPath, export: true, override: true });
    }
}
