import { Step } from 'kronos-step';

const tar = require('tar-stream');

/**
 * UnTar Step
 */
export class UnTarStep extends Step {
  static get name() {
    return 'kronos-untar';
  }
  static get description() {
    return 'decomposes tar archive into individual output requests';
  }
  static get endpoints() {
    return {
      in: {
        in: true
      },
      out: {
        out: true
      }
    };
  }

  async _start() {
    this.ongoingRequests = new Set();

    const step = this;

    step.endpoints.in.receive = async request =>
      new Promise((resolve, reject) => {
        // what we need to handle one incoming request
        const current = {
          request: request,
          responses: [],
          extract: tar.extract()
        };

        ongoingRequests.add(current);

        current.request.payload.pipe(current.extract);

        current.rejected = rejected;

        current.extract.on('finish', () => {
          // our request is done
          resolve(Promise.all(current.responses));
          ongoingRequests.delete(current);
        });

        // This will be called from the untar function for each element in the TAR archive
        current.extract.on('entry', (header, stream, callback) => {
          stream.on('end', () => callback());

          try {
            current.responses.push(
              step.endpoints.out.receive(
                {
                  info: header,
                  payload: stream
                },
                request
              )
            );
          } catch (e) {
            step.error(e);
            stream.resume();
            reject(e);
          }
        });
      });
  }

  async _stop() {
    // reject all ongoing requests
    this.ongoingRequests.forEach(r => {
      r.request.payload.unpipe(r.extract);
      r.rejected();
    });

    delete this.ongoingRequests;
  }
}
